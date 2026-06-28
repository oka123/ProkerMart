"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Navigation, Package, User,
  ExternalLink, CheckCircle, Loader2, WifiOff, AlertCircle, CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";

const TrackingMap = dynamic(() => import("@/components/delivery/TrackingMap"), { ssr: false });

interface OrderDetail {
  id_pesanan: string;
  kode_unik: string;
  status_pesanan: string;
  alamat_pengambilan: string | null;
  lat_pengantar: number | null;
  lng_pengantar: number | null;
  lokasi_updated_at: string | null;
  pengguna: { nama: string; email: string } | null;
  detail_pesanan: { jumlah: number; harga_satuan: number; sub_total: number; produk: { nama_produk: string } | null }[];
  metode_pembayaran: string | null;
}

export default function DeliveryPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
      <DeliveryPage />
    </Suspense>
  );
}

function DeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();
  const idMember = active?.id_member ?? null;

  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GPS state
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const [completing, setCompleting] = useState(false);

  // Fetch order details
  useEffect(() => {
    supabase
      .from("pesanan")
      .select(`
        id_pesanan, kode_unik, status_pesanan, alamat_pengambilan, metode_pembayaran,
        lat_pengantar, lng_pengantar, lokasi_updated_at,
        pengguna:id_pengguna(nama, email),
        detail_pesanan(jumlah, harga_satuan, sub_total, produk:id_produk(nama_produk))
      `)
      .eq("id_pesanan", orderId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) { setError(`Error: ${err.message} (${err.code})`); setLoading(false); return; }
        if (!data) { setError(`Pesanan tidak ditemukan (id: ${orderId})`); setLoading(false); return; }
        setOrder(data as any);
        setLoading(false);
      });
  }, [orderId, supabase]);

  // Set status "dikirim" immediately — doesn't need idMember
  useEffect(() => {
    if (!orderId) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("pesanan")
        .update({ status_pesanan: "dikirim", is_tujuan_aktif: true })
        .eq("id_pesanan", orderId)
        .neq("status_pesanan", "dikirim")
        .then(() => {});
    });
  }, [orderId, supabase]);

  // Start GPS when idMember is ready
  useEffect(() => {
    if (!idMember || !orderId) return;

    if (!navigator.geolocation) {
      setGpsError("Browser tidak support geolocation");
      return;
    }

    const pushLocation = (latitude: number, longitude: number) => {
      setMyLat(latitude);
      setMyLng(longitude);
      setGpsError(null);
      supabase
        .from("pesanan")
        .update({ lat_pengantar: latitude, lng_pengantar: longitude, lokasi_updated_at: new Date().toISOString(), pengantar_id: idMember })
        .eq("id_pesanan", orderId)
        .then(() => {});
    };

    // Immediately get current position so buyer sees map right away
    navigator.geolocation.getCurrentPosition(
      (pos) => { pushLocation(pos.coords.latitude, pos.coords.longitude); setGpsTracking(true); },
      () => {}, // silent — watchPosition will handle errors
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Then watch for continuous updates (throttled 10s)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 10000) {
          setMyLat(pos.coords.latitude);
          setMyLng(pos.coords.longitude);
          return;
        }
        lastUpdateRef.current = now;
        pushLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => { setGpsError(err.message); setGpsTracking(false); },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    setGpsTracking(true);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [idMember, orderId, supabase]);

  const handleSelesai = async () => {
    setCompleting(true);
    const { error: err } = await supabase
      .from("pesanan")
      .update({ status_pesanan: "selesai", is_tujuan_aktif: false })
      .eq("id_pesanan", orderId);
    if (err) { setCompleting(false); return; }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    router.push("/dashboard/orders");
  };

  const alamat = order?.alamat_pengambilan ?? null;
  const mapsUrl = alamat ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alamat)}` : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p>{error ?? "Terjadi kesalahan"}</p>
        <button onClick={() => router.back()} className="text-sm text-primary-600 underline">Kembali</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Pengiriman Aktif</h1>
          <p className="text-xs text-slate-500 font-mono">#{order.kode_unik}</p>
        </div>
      </div>

      {/* GPS Status */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
        gpsError
          ? "bg-red-50 border-red-200 text-red-700"
          : gpsTracking
          ? "bg-sky-50 border-sky-200 text-sky-700"
          : "bg-amber-50 border-amber-200 text-amber-700"
      }`}>
        {gpsError ? (
          <><WifiOff className="w-4 h-4 shrink-0" /> GPS error: {gpsError}</>
        ) : gpsTracking ? (
          <><Navigation className="w-4 h-4 shrink-0 animate-pulse" /> Lokasi kamu sedang dibagikan ke pembeli secara real-time</>
        ) : (
          <><Loader2 className="w-4 h-4 shrink-0 animate-spin" /> Mengaktifkan GPS...</>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-500" />
          <span className="text-sm font-semibold text-slate-700">Posisi Kamu (Live)</span>
        </div>
        <div className="h-64 relative">
          {myLat && myLng ? (
            <TrackingMap lat={myLat} lng={myLng} updatedAt={new Date().toISOString()} mapId={`delivery-${orderId}`} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
              {gpsError ? "GPS tidak tersedia" : "Menunggu sinyal GPS..."}
            </div>
          )}
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {/* Buyer */}
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Pembeli</p>
            <p className="text-sm font-semibold text-slate-800">{(order.pengguna as any)?.nama ?? "—"}</p>
            <p className="text-xs text-slate-500">{(order.pengguna as any)?.email ?? ""}</p>
          </div>
        </div>

        {/* Alamat */}
        {alamat && (
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Alamat Pengiriman</p>
              <p className="text-sm text-slate-800 leading-relaxed">{alamat}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka di Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* Payment */}
        {order.metode_pembayaran && (() => {
          const metode = order.metode_pembayaran as string;
          const isCod = metode === "cod" || metode === "tunai";
          const metodeLabel = metode === "cod" ? "COD (Bayar di Tempat)" : metode === "tunai" ? "Tunai" : metode.toUpperCase();
          return (
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-0.5">Pembayaran</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{metodeLabel}</span>
                  {isCod ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Bayar di Tempat</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Sudah Lunas</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Items */}
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-1.5">Item Pesanan</p>
            <div className="space-y-2">
              {order.detail_pesanan.map((d, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 truncate">{(d.produk as any)?.nama_produk ?? "—"}</p>
                    <p className="text-xs text-slate-400">
                      {d.jumlah} × {d.harga_satuan.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {d.sub_total.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  {order.detail_pesanan.reduce((s, d) => s + d.sub_total, 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selesai Antar */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSelesai}
        disabled={completing}
        className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-base rounded-2xl shadow-lg transition-colors"
      >
        {completing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
        Selesai Antar
      </motion.button>
    </div>
  );
}
