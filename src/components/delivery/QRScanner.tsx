"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, QrCode, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface QRScannerProps {
  subTokoId: string;
  supabase: any;
  onClose: () => void;
  onSuccess: (kodeUnik: string) => void;
}

type ScanState = "scanning" | "verifying" | "success" | "error";

export default function QRScanner({ subTokoId, supabase, onClose, onSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [message, setMessage] = useState<string>("");
  const [scannedCode, setScannedCode] = useState<string>("");
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const scannerId = "qr-reader-panitia";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;

        setScannedCode(decodedText);
        setScanState("verifying");

        try {
          await scanner.stop();
        } catch {}

        // Verify: cari pesanan dengan kode ini di sub_toko ini
        const { data, error } = await supabase
          .from("pesanan")
          .select("id_pesanan, status_pesanan, kode_unik")
          .eq("kode_unik", decodedText)
          .eq("id_sub_toko", subTokoId)
          .eq("status_pesanan", "siap_diambil")
          .maybeSingle();

        if (error || !data) {
          setScanState("error");
          setMessage("Kode tidak valid, bukan milik toko ini, atau pesanan belum siap diambil.");
          return;
        }

        // Confirm order
        const { error: updateError } = await supabase
          .from("pesanan")
          .update({ status_pesanan: "selesai" })
          .eq("id_pesanan", data.id_pesanan);

        if (updateError) {
          setScanState("error");
          setMessage("Gagal konfirmasi pesanan. Coba lagi.");
          return;
        }

        setScanState("success");
        setMessage(`Pesanan ${decodedText} berhasil dikonfirmasi!`);
        onSuccess(decodedText);
      },
      () => {} // ignore frame errors
    ).catch((err) => {
      setScanState("error");
      setMessage(`Kamera tidak bisa diakses: ${err}`);
    });

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    hasScannedRef.current = false;
    setScanState("scanning");
    setMessage("");
    setScannedCode("");

    // Restart scanner
    const scannerId = "qr-reader-panitia";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (hasScannedRef.current) return;
        hasScannedRef.current = true;
        setScannedCode(decodedText);
        setScanState("verifying");
        try { await scanner.stop(); } catch {}

        const { data } = await supabase
          .from("pesanan")
          .select("id_pesanan, kode_unik")
          .eq("kode_unik", decodedText)
          .eq("id_sub_toko", subTokoId)
          .eq("status_pesanan", "siap_diambil")
          .maybeSingle();

        if (!data) {
          setScanState("error");
          setMessage("Kode tidak valid atau bukan milik toko ini.");
          return;
        }

        await supabase.from("pesanan").update({ status_pesanan: "selesai" }).eq("id_pesanan", data.id_pesanan);
        setScanState("success");
        setMessage(`Pesanan ${decodedText} berhasil dikonfirmasi!`);
        onSuccess(decodedText);
      },
      () => {}
    ).catch((err) => { setScanState("error"); setMessage(`Kamera error: ${err}`); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-slate-900">Scan QR Pembeli</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-5 space-y-4">
          {/* QR reader div — always mounted so html5-qrcode can attach */}
          <div
            id="qr-reader-panitia"
            className={`w-full rounded-xl overflow-hidden ${scanState !== "scanning" ? "hidden" : ""}`}
          />

          {scanState === "scanning" && (
            <p className="text-xs text-center text-slate-500">
              Arahkan kamera ke QR Code pembeli
            </p>
          )}

          {scanState === "verifying" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
              <p className="text-sm font-semibold text-slate-700">Memverifikasi kode...</p>
              <p className="font-mono text-xs text-slate-400">{scannedCode}</p>
            </div>
          )}

          {scanState === "success" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-14 h-14 text-emerald-500" />
              <p className="font-bold text-emerald-700 text-center">{message}</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          {scanState === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-sm text-red-600 text-center">{message}</p>
              <button
                onClick={handleRetry}
                className="mt-1 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Scan Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
