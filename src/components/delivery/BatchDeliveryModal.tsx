"use client";

import { useState } from "react";
import { X, MapPin, Loader2, Navigation, CheckCircle, Package } from "lucide-react";

interface BatchOrder {
  id_pesanan: string;
  kode_unik: string;
  pengguna: { nama: string } | null;
  alamat_pengambilan: string | null;
}

interface BatchDeliveryModalProps {
  orders: BatchOrder[];
  memberId: string;
  onClose: () => void;
  onSuccess: (idRonde: string, updatedIds: string[]) => void;
}

type Step = "select" | "locating" | "preview" | "sending" | "done";

interface SortedResult {
  id_pesanan: string;
  urutan: number;
  dist_km: string;
}

export default function BatchDeliveryModal({ orders, memberId, onClose, onSuccess }: BatchDeliveryModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [panitiaLat, setPanitiaLat] = useState<number | null>(null);
  const [panitiaLng, setPanitiaLng] = useState<number | null>(null);
  const [sortedResult, setSortedResult] = useState<SortedResult[]>([]);
  const [idRonde, setIdRonde] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleGetLocationAndSort = () => {
    setStep("locating");
    setError(null);

    if (!navigator.geolocation) {
      setError("Browser tidak support geolocation. Lanjut tanpa urutan jarak.");
      startBatch(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPanitiaLat(pos.coords.latitude);
        setPanitiaLng(pos.coords.longitude);
        startBatch(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Gagal ambil GPS. Urutan berdasarkan waktu pesanan.");
        startBatch(null, null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const startBatch = async (lat: number | null, lng: number | null) => {
    setStep("sending");
    try {
      const res = await fetch("/api/delivery/start-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: orders.map(o => ({ id_pesanan: o.id_pesanan, alamat_pengambilan: o.alamat_pengambilan ?? "" })),
          lat,
          lng,
          pengantar_id: memberId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSortedResult(data.sorted);
      setIdRonde(data.id_ronde);
      setStep("done");
      onSuccess(data.id_ronde, orders.map(o => o.id_pesanan));
    } catch (err: any) {
      setError(err.message);
      setStep("select");
    }
  };

  // Map id_pesanan → order for display
  const orderMap = Object.fromEntries(orders.map(o => [o.id_pesanan, o]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-900">Antar Batch ({orders.length} Pesanan)</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Step: select / confirm */}
          {step === "select" && (
            <>
              <p className="text-sm text-slate-600">
                Sistem akan ambil GPS kamu → geocode tiap alamat → urutkan dari yang terdekat.
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {orders.map((o, i) => (
                  <div key={o.id_pesanan} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{o.pengguna?.nama ?? "—"}</p>
                      <p className="text-xs text-slate-500 truncate">{o.alamat_pengambilan ?? "Alamat tidak ada"}</p>
                      <p className="font-mono text-[10px] text-slate-400">{o.kode_unik}</p>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button
                onClick={handleGetLocationAndSort}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" /> Ambil GPS & Mulai Antar
              </button>
            </>
          )}

          {/* Step: locating / sending */}
          {(step === "locating" || step === "sending") && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
              <p className="text-sm font-semibold text-slate-700">
                {step === "locating" ? "Mengambil lokasi GPS..." : "Mengurutkan & memulai pengiriman..."}
              </p>
              {step === "sending" && (
                <p className="text-xs text-slate-400 text-center">Geocoding {orders.length} alamat, mohon tunggu...</p>
              )}
            </div>
          )}

          {/* Step: done */}
          {step === "done" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle className="w-5 h-5" />
                <span>Batch dimulai! Urutan pengiriman:</span>
              </div>
              <div className="space-y-2">
                {sortedResult.map((r) => {
                  const o = orderMap[r.id_pesanan];
                  return (
                    <div key={r.id_pesanan} className={`flex items-start gap-3 p-3 rounded-xl border ${r.urutan === 1 ? "bg-sky-50 border-sky-200" : "bg-slate-50 border-slate-200"}`}>
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${r.urutan === 1 ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"}`}>{r.urutan}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-800">{o?.pengguna?.nama ?? "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{o?.alamat_pengambilan}</p>
                        {r.dist_km !== "999.00" && <p className="text-[10px] text-sky-600">~{r.dist_km} km</p>}
                      </div>
                      {r.urutan === 1 && <Package className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
              <button onClick={onClose} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
