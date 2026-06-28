"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, Loader2, MapPin, Navigation, WifiOff } from "lucide-react";
import Link from "next/link";

const TrackingMap = dynamic(() => import("@/components/delivery/TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  ),
});

interface TrackingData {
  lat: number;
  lng: number;
  updatedAt: string | null;
  alamat: string | null;
  storeName: string;
  status: string;
  isTujuanAktif: boolean;
}

function TrackingContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const supabase = createClient();

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noLocation, setNoLocation] = useState(false);
  const [waitingForTurn, setWaitingForTurn] = useState(false);

  const fetchTracking = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: pesanan, error } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan, status_pesanan, lat_pengantar, lng_pengantar,
        lokasi_updated_at, alamat_pengambilan, is_tujuan_aktif,
        sub_toko(nama_proker)
      `)
      .eq("id_pesanan", orderId)
      .eq("id_pengguna", user.id)
      .single();

    if (error || !pesanan) { router.push("/user/purchase"); return; }

    if (pesanan.status_pesanan !== "dikirim") {
      router.push(`/user/purchase/${orderId}`);
      return;
    }

    const subToko = Array.isArray(pesanan.sub_toko) ? pesanan.sub_toko[0] : pesanan.sub_toko;

    const isTujuanAktif = pesanan.is_tujuan_aktif ?? true;
    setWaitingForTurn(!isTujuanAktif);

    if (!pesanan.lat_pengantar || !pesanan.lng_pengantar) {
      setNoLocation(true);
      setData({
        lat: 0, lng: 0,
        updatedAt: null,
        alamat: pesanan.alamat_pengambilan,
        storeName: subToko?.nama_proker ?? "Panitia",
        status: pesanan.status_pesanan,
        isTujuanAktif,
      });
    } else {
      setData({
        lat: pesanan.lat_pengantar,
        lng: pesanan.lng_pengantar,
        updatedAt: pesanan.lokasi_updated_at,
        alamat: pesanan.alamat_pengambilan,
        storeName: subToko?.nama_proker ?? "Panitia",
        status: pesanan.status_pesanan,
        isTujuanAktif,
      });
    }
    setLoading(false);
  }, [orderId, supabase, router]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tracking:${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pesanan", filter: `id_pesanan=eq.${orderId}` },
        (payload) => {
          const row = payload.new as any;
          if (row.status_pesanan === "selesai") {
            router.push(`/user/purchase/${orderId}`);
            return;
          }
          const isTujuanAktif = row.is_tujuan_aktif ?? true;
          setWaitingForTurn(!isTujuanAktif);
          if (row.lat_pengantar && row.lng_pengantar) {
            setNoLocation(false);
            setData((prev) => prev ? {
              ...prev,
              lat: row.lat_pengantar,
              lng: row.lng_pengantar,
              updatedAt: row.lokasi_updated_at,
              status: row.status_pesanan,
              isTujuanAktif,
            } : prev);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4 flex-1">
        <Link href={`/user/purchase/${orderId}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Pesanan
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Lacak Pesanan</h1>
              <p className="text-xs text-slate-500">{data?.storeName} sedang dalam perjalanan</p>
            </div>
          </div>

          {data?.alamat && (
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl mb-4">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">{data.alamat}</p>
            </div>
          )}

          {waitingForTurn ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 bg-amber-50 rounded-xl border border-amber-200">
              <Clock className="w-10 h-10 text-amber-400" />
              <div className="text-center px-4">
                <p className="font-semibold text-amber-800 text-sm">Pesanan sedang diantar ke tempat lain dahulu</p>
                <p className="text-xs text-amber-600 mt-1">Karena antrian padat, mohon ditunggu. Peta akan muncul saat panitia dalam perjalanan ke kamu.</p>
              </div>
            </div>
          ) : noLocation ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <WifiOff className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-500 text-center">
                Panitia belum membagikan lokasi.<br />
                <span className="text-xs">Halaman akan update otomatis.</span>
              </p>
            </div>
          ) : (
            <div className="h-72 sm:h-96 rounded-xl overflow-hidden border border-slate-200">
              {data && <TrackingMap lat={data.lat} lng={data.lng} updatedAt={data.updatedAt} mapId="buyer-track-map" />}
            </div>
          )}

          {data?.updatedAt && (
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              Lokasi diupdate: {new Date(data.updatedAt).toLocaleTimeString("id-ID")}
            </p>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
          Peta menampilkan posisi panitia pengantar secara real-time. Pastikan kamu siap menerima pesanan.
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
