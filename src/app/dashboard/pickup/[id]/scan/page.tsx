"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, KeyRound, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TabMode = "scan" | "code";
type ConfirmState = "idle" | "verifying" | "success" | "error";

export default function PickupScanPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
      <PickupScanPage />
    </Suspense>
  );
}

function PickupScanPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const orderId = params.id as string;

  const [tab, setTab] = useState<TabMode>("scan");
  const [manualCode, setManualCode] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [kodeUnik, setKodeUnik] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const hasScannedRef = useRef(false);
  const scannerStartedRef = useRef(false);

  // Fetch kode_unik
  useEffect(() => {
    supabase
      .from("pesanan")
      .select("kode_unik")
      .eq("id_pesanan", orderId)
      .maybeSingle()
      .then(({ data }) => { if (data) setKodeUnik(data.kode_unik); });
  }, [orderId, supabase]);

  // QR Scanner lifecycle — start once on mount, stop on unmount only
  useEffect(() => {
    if (confirmState !== "idle") return;

    let cancelled = false;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scannerId = "qr-reader-pickup-scan";
      const el = document.getElementById(scannerId);
      if (!el) return;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      hasScannedRef.current = false;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            scannerStartedRef.current = false;
            try { scanner.stop(); } catch {}
            confirmPickup(decoded);
          },
          () => {}
        );
        if (!cancelled) scannerStartedRef.current = true;
        else { try { scanner.stop(); } catch {} }
      } catch (err: any) {
        if (!cancelled) {
          setConfirmState("error");
          setConfirmMsg(`Kamera tidak bisa diakses: ${err}`);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      const running = scannerStartedRef.current;
      scannerStartedRef.current = false;
      if (s && running) {
        try { if (s.getState?.() === 2) s.stop().catch(() => {}); } catch {}
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmState]);

  const confirmPickup = async (kode: string) => {
    setConfirmState("verifying");

    let targetKode = kodeUnik;
    if (!targetKode) {
      const { data } = await supabase.from("pesanan").select("kode_unik").eq("id_pesanan", orderId).maybeSingle();
      targetKode = data?.kode_unik ?? null;
    }

    if (!targetKode || kode.trim() !== targetKode) {
      setConfirmState("error");
      setConfirmMsg("Kode tidak cocok dengan pesanan ini.");
      return;
    }

    const { error: err } = await supabase
      .from("pesanan")
      .update({ status_pesanan: "selesai" })
      .eq("id_pesanan", orderId);

    if (err) {
      setConfirmState("error");
      setConfirmMsg("Gagal konfirmasi. Coba lagi.");
      return;
    }

    setConfirmState("success");
    setConfirmMsg("Pesanan berhasil dikonfirmasi!");
  };

  const handleReset = () => {
    setConfirmState("idle");
    setConfirmMsg("");
    setManualCode("");
    hasScannedRef.current = false;
  };

  if (confirmState === "success") return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-5 py-16 px-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <CheckCircle className="w-20 h-20 text-emerald-500" />
      </motion.div>
      <p className="font-bold text-emerald-700 text-center text-xl">{confirmMsg}</p>
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="mt-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
      >
        Kembali ke Pesanan
      </button>
    </div>
  );

  if (confirmState === "error") return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-5 py-16 px-6">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <p className="text-base text-red-600 text-center font-semibold">{confirmMsg}</p>
      <button
        onClick={handleReset}
        className="px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Konfirmasi Pembeli</h1>
      </div>

      {/* Tab + Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab("scan")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              tab === "scan"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <QrCode className="w-4 h-4" /> Scan QR
          </button>
          <button
            onClick={() => setTab("code")}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors ${
              tab === "code"
                ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50/40"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <KeyRound className="w-4 h-4" /> Masukkan Kode
          </button>
        </div>

        <div className="p-5">
          {/* Scan tab — always mounted so scanner doesn't restart on tab switch */}
          <div className={tab === "scan" ? "block" : "hidden"}>
            {confirmState === "verifying" ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                <p className="text-sm font-semibold text-slate-700">Memverifikasi...</p>
              </div>
            ) : (
              <>
                <div id="qr-reader-pickup-scan" className="w-full rounded-xl overflow-hidden" />
                <p className="text-xs text-center text-slate-500 mt-3">
                  Arahkan kamera ke QR Code yang ditampilkan pembeli
                </p>
              </>
            )}
          </div>

          {/* Code tab */}
          <div className={tab === "code" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kode Pesanan</label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: ABC123"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-mono text-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-400 text-center tracking-widest uppercase"
                />
              </div>
              {confirmState === "verifying" ? (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  <span className="text-sm text-slate-600">Memverifikasi...</span>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => confirmPickup(manualCode)}
                  disabled={!manualCode.trim()}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
                >
                  Konfirmasi
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
