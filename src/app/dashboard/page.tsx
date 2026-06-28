"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign, ShoppingBag, Users, AlertCircle, Loader2,
  ArrowUpRight, ArrowDownRight, Package, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";

interface Stats {
  pendapatan: number;
  pendapatanPrev: number;
  pesananMasuk: number;
  pesananMasukPrev: number;
  pembeliUnik: number;
  pembeliUnikPrev: number;
  produkAktif: number;
}

interface RecentOrder {
  id_pesanan: string;
  kode_unik: string;
  total_harga: number;
  status_pesanan: string;
  tgl_pesan: string;
  buyer: string;
  first_product: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  menunggu_pembayaran:  { label: "Menunggu Bayar",    color: "bg-slate-100 text-slate-600" },
  menunggu_konfirmasi:  { label: "Perlu Konfirmasi",  color: "bg-amber-100 text-amber-700" },
  diproses:             { label: "Diproses",           color: "bg-blue-100 text-blue-700" },
  siap_diambil:         { label: "Siap Diambil",       color: "bg-emerald-100 text-emerald-700" },
  dikirim:              { label: "Dikirim",             color: "bg-sky-100 text-sky-700" },
  selesai:              { label: "Selesai",             color: "bg-emerald-100 text-emerald-700" },
  dibatalkan:           { label: "Dibatalkan",          color: "bg-red-100 text-red-600" },
};

type Period = "7" | "30" | "bulan";

function getPeriodDates(period: Period): { from: Date; prevFrom: Date; prevTo: Date } {
  const now = new Date();
  const from = new Date(now);

  if (period === "bulan") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const prevFrom = new Date(from);
    prevFrom.setMonth(prevFrom.getMonth() - 1);
    const prevTo = new Date(from);
    return { from, prevFrom, prevTo };
  }

  const days = parseInt(period);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - days);
  const prevTo = new Date(from);
  return { from, prevFrom, prevTo };
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function TrendBadge({ curr, prev }: { curr: number; prev: number }) {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return (
    <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
      <ArrowUpRight className="w-3 h-3" /> Baru
    </span>
  );
  const pct = ((curr - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();
  const idSubToko = active?.id_sub_toko ?? null;

  const [period, setPeriod] = useState<Period>("30");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idSubToko) return;

    setLoading(true);

    const { from, prevFrom, prevTo } = getPeriodDates(period);

    Promise.all([
      // Current period pesanan
      supabase
        .from("pesanan")
        .select("id_pesanan, id_pengguna, total_harga, status_pesanan")
        .eq("id_sub_toko", idSubToko)
        .gte("tgl_pesan", from.toISOString()),

      // Prev period pesanan
      supabase
        .from("pesanan")
        .select("id_pengguna, total_harga, status_pesanan")
        .eq("id_sub_toko", idSubToko)
        .gte("tgl_pesan", prevFrom.toISOString())
        .lt("tgl_pesan", prevTo.toISOString()),

      // Produk aktif
      supabase
        .from("produk")
        .select("id_produk", { count: "exact", head: true })
        .eq("id_sub_toko", idSubToko)
        .eq("status_aktif", true),

      // Recent orders
      supabase
        .from("pesanan")
        .select(`
          id_pesanan, kode_unik, total_harga, status_pesanan, tgl_pesan,
          pengguna:id_pengguna(nama),
          detail_pesanan(produk:id_produk(nama_produk))
        `)
        .eq("id_sub_toko", idSubToko)
        .order("tgl_pesan", { ascending: false })
        .limit(5),

      // Pending count
      supabase
        .from("pesanan")
        .select("id_pesanan", { count: "exact", head: true })
        .eq("id_sub_toko", idSubToko)
        .in("status_pesanan", ["menunggu_konfirmasi", "diproses", "siap_diambil", "dikirim"]),
    ]).then(([curr, prev, produk, recent, pending]) => {
      const currData = curr.data ?? [];
      const prevData = prev.data ?? [];

      const sumHarga = (rows: any[]) =>
        rows.filter(r => r.status_pesanan === "selesai").reduce((s, r) => s + Number(r.total_harga), 0);
      const countMasuk = (rows: any[]) =>
        rows.filter(r => r.status_pesanan !== "dibatalkan").length;
      const uniqueBuyer = (rows: any[]) =>
        new Set(rows.map(r => r.id_pengguna)).size;

      setStats({
        pendapatan: sumHarga(currData),
        pendapatanPrev: sumHarga(prevData),
        pesananMasuk: countMasuk(currData),
        pesananMasukPrev: countMasuk(prevData),
        pembeliUnik: uniqueBuyer(currData),
        pembeliUnikPrev: uniqueBuyer(prevData),
        produkAktif: produk.count ?? 0,
      });

      setRecentOrders(
        (recent.data ?? []).map((o: any) => ({
          id_pesanan: o.id_pesanan,
          kode_unik: o.kode_unik,
          total_harga: Number(o.total_harga),
          status_pesanan: o.status_pesanan,
          tgl_pesan: o.tgl_pesan,
          buyer: o.pengguna?.nama ?? "—",
          first_product: o.detail_pesanan?.[0]?.produk?.nama_produk ?? "—",
        }))
      );

      setPendingCount(pending.count ?? 0);
      setLoading(false);
    });
  }, [idSubToko, period, supabase]);

  if (!idSubToko) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <AlertCircle className="w-8 h-8 text-slate-300" />
      <p className="text-sm">Pilih proker terlebih dahulu</p>
    </div>
  );

  const statCards = stats ? [
    {
      name: "Total Pendapatan",
      value: formatRp(stats.pendapatan),
      curr: stats.pendapatan,
      prev: stats.pendapatanPrev,
      icon: DollarSign,
    },
    {
      name: "Pesanan Masuk",
      value: stats.pesananMasuk.toString(),
      curr: stats.pesananMasuk,
      prev: stats.pesananMasukPrev,
      icon: ShoppingBag,
    },
    {
      name: "Pembeli Unik",
      value: stats.pembeliUnik.toString(),
      curr: stats.pembeliUnik,
      prev: stats.pembeliUnikPrev,
      icon: Users,
    },
    {
      name: "Produk Aktif",
      value: stats.produkAktif.toString(),
      curr: stats.produkAktif,
      prev: stats.produkAktif,
      icon: Package,
    },
  ] : [];

  const periodLabel: Record<Period, string> = {
    "7": "7 Hari Terakhir",
    "30": "30 Hari Terakhir",
    "bulan": "Bulan Ini",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ringkasan Performa</h1>
          <p className="text-sm text-slate-500">
            {active?.nama_proker ?? "Proker"} · {periodLabel[period]}
          </p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as Period)}
          className="bg-white border border-slate-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="7">7 Hari Terakhir</option>
          <option value="30">30 Hari Terakhir</option>
          <option value="bulan">Bulan Ini</option>
        </select>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0,1,2,3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  {stat.name !== "Produk Aktif" && (
                    <TrendBadge curr={stat.curr} prev={stat.prev} />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Pesanan Terbaru</h2>
            <button
              onClick={() => router.push("/dashboard/orders")}
              className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[0,1,2].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">Belum ada pesanan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Kode</th>
                    <th className="px-5 py-3">Pembeli</th>
                    <th className="px-5 py-3 hidden md:table-cell">Produk</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map(order => {
                    const s = STATUS_LABEL[order.status_pesanan] ?? { label: order.status_pesanan, color: "bg-slate-100 text-slate-600" };
                    return (
                      <tr
                        key={order.id_pesanan}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => router.push("/dashboard/orders")}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                          {order.kode_unik}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{order.buyer}</td>
                        <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell max-w-[160px] truncate">
                          {order.first_product}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                          {formatRp(order.total_harga)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Perlu Tindakan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Perlu Tindakan</h2>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-3">
            {loading ? (
              <div className="h-16 bg-slate-100 rounded animate-pulse" />
            ) : pendingCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm py-6">
                <ShoppingBag className="w-8 h-8 text-slate-200" />
                Tidak ada pesanan yang perlu ditindak
              </div>
            ) : (
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">{pendingCount} Pesanan Aktif</p>
                    <p className="text-xs text-amber-700">Perlu konfirmasi atau pengiriman</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
              </button>
            )}

            <button
              onClick={() => router.push("/dashboard/orders")}
              className="mt-auto w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Kelola Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
