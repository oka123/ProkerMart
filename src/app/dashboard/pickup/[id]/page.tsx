"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, User, MapPin, QrCode, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PickupOrder {
  id_pesanan: string;
  kode_unik: string;
  status_pesanan: string;
  alamat_pengambilan: string | null;
  pengguna: { nama: string; email: string } | null;
  detail_pesanan: {
    jumlah: number;
    harga_satuan: number;
    sub_total: number;
    produk: { nama_produk: string; sub_toko: { alamat: string | null } | null } | null;
  }[];
}

export default function PickupPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
      <PickupPage />
    </Suspense>
  );
}

function PickupPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const orderId = params.id as string;

  const [order, setOrder] = useState<PickupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("pesanan")
      .select(`
        id_pesanan, kode_unik, status_pesanan, alamat_pengambilan,
        pengguna:id_pengguna(nama, email),
        detail_pesanan(jumlah, harga_satuan, sub_total, produk:id_produk(nama_produk, sub_toko:id_sub_toko(alamat)))
      `)
      .eq("id_pesanan", orderId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) { setError(`Error: ${err.message}`); setLoading(false); return; }
        if (!data) { setError("Pesanan tidak ditemukan"); setLoading(false); return; }
        setOrder(data as any);
        setLoading(false);
      });
  }, [orderId, supabase]);

  const pickupAlamat = order?.detail_pesanan
    .map(d => (d.produk as any)?.sub_toko?.alamat)
    .find(Boolean) ?? order?.alamat_pengambilan ?? null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  if (error || !order) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p>{error ?? "Terjadi kesalahan"}</p>
      <button onClick={() => router.back()} className="text-sm text-primary-600 underline">Kembali</button>
    </div>
  );

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
          <h1 className="text-lg font-bold text-slate-900">Konfirmasi Ambil</h1>
          <p className="text-xs text-slate-500 font-mono">#{order.kode_unik}</p>
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

        {/* Lokasi ketemu */}
        {pickupAlamat && (
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <MapPin className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Lokasi Ketemu</p>
              <p className="text-sm text-slate-800">{pickupAlamat}</p>
            </div>
          </div>
        )}

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
                    <p className="text-sm text-slate-800 truncate">
                      {(d.produk as any)?.nama_produk ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {d.jumlah} × {d.harga_satuan.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 shrink-0">
                    {d.sub_total.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-xs font-semibold text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-900">
                  {order.detail_pesanan
                    .reduce((s, d) => s + d.sub_total, 0)
                    .toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push(`/dashboard/pickup/${orderId}/scan`)}
        className="w-full flex items-center justify-center gap-3 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg transition-colors text-base"
      >
        <QrCode className="w-5 h-5" />
        Scan QR Code atau Masukkan Kode
      </motion.button>
    </div>
  );
}
