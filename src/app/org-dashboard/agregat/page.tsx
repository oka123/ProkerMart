"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Filter,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Loader2,
  Store,
  Calendar,
  LayoutList
} from "lucide-react";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";

interface SubTokoOption {
  id: string;
  name: string;
}

interface OrderRow {
  id_pesanan: string;
  id_sub_toko: string;
  total_harga: number;
  tgl_pesan: string;
  status_pesanan: string;
}

export default function ReportsPage() {
  const { org } = useOrgDashboard();
  const [subTokoOptions, setSubTokoOptions] = useState<SubTokoOption[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProker, setSelectedProker] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const fetchData = useCallback(async () => {
    if (!org?.id_toko) { setLoading(false); return; }
    const supabase = createClient();

    try {
      // Fetch sub_toko list for filter
      const { data: subTokos } = await supabase
        .from("sub_toko")
        .select("id_sub_toko, nama_proker")
        .eq("id_toko", org.id_toko);

      const options: SubTokoOption[] = [
        { id: "all", name: "Semua Proker" },
        ...(subTokos ?? []).map((st) => ({
          id: st.id_sub_toko,
          name: st.nama_proker,
        })),
      ];
      setSubTokoOptions(options);

      // Fetch only 'selesai' orders — cancelled/pending orders must not inflate revenue
      const subTokoIds = (subTokos ?? []).map((st) => st.id_sub_toko);
      if (subTokoIds.length > 0) {
        let query = supabase
          .from("pesanan")
          .select("id_pesanan, id_sub_toko, total_harga, tgl_pesan, status_pesanan")
          .in("id_sub_toko", subTokoIds)
          .eq("status_pesanan", "selesai");

        if (timeFilter !== "all") {
          const date = new Date();
          if (timeFilter === "7d") date.setDate(date.getDate() - 7);
          else if (timeFilter === "30d") date.setMonth(date.getMonth() - 1);
          else if (timeFilter === "1y") date.setFullYear(date.getFullYear() - 1);
          query = query.gte("tgl_pesan", date.toISOString());
        }

        const { data: ordersData } = await query;

        setOrders(
          (ordersData ?? []).map((o) => ({
            id_pesanan: o.id_pesanan,
            id_sub_toko: o.id_sub_toko,
            total_harga: Number(o.total_harga) || 0,
            tgl_pesan: o.tgl_pesan,
            status_pesanan: o.status_pesanan,
          }))
        );
      }
    } catch (err) {
      console.error("[OrgDashboard - Agregat] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [org?.id_toko, timeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter orders based on selected proker
  const filteredOrders = useMemo(() => {
    if (selectedProker === "all") return orders;
    return orders.filter((o) => o.id_sub_toko === selectedProker);
  }, [orders, selectedProker]);

  // Calculate report data
  const reportData = useMemo(() => {
    const revenue = filteredOrders.reduce((sum, o) => sum + o.total_harga, 0);
    const orderCount = filteredOrders.length;
    const aov = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

    // Simple chart: group by day (last 7 entries or aggregate)
    const dayMap: Record<string, number> = {};
    for (const o of filteredOrders) {
      const day = o.tgl_pesan ? o.tgl_pesan.slice(0, 10) : "unknown";
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    const sortedDays = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);

    const maxVal = Math.max(...sortedDays.map(([, v]) => v), 1);
    const chartData = sortedDays.map(([day, count]) => ({
      label: day,
      value: Math.round((count / maxVal) * 100),
      count,
    }));

    // Pad to at least 7 bars
    while (chartData.length < 7) {
      chartData.unshift({ label: "", value: 0, count: 0 });
    }

    return { revenue, orders: orderCount, aov, chartData };
  }, [filteredOrders]);

  // Top selling products
  const [topProducts, setTopProducts] = useState<
    { name: string; sold: number; price: number }[]
  >([]);

  useEffect(() => {
    if (!org?.id_toko) return;
    const supabase = createClient();

    const fetchTopProducts = async () => {
      const subTokoIds =
        selectedProker === "all"
          ? subTokoOptions.filter((o) => o.id !== "all").map((o) => o.id)
          : [selectedProker];

      if (subTokoIds.length === 0) return;

      // Fetch produk for these sub_tokos
      const { data: products } = await supabase
        .from("produk")
        .select("id_produk, nama_produk, harga")
        .in("id_sub_toko", subTokoIds);

      if (!products || products.length === 0) {
        setTopProducts([]);
        return;
      }

      // Fetch detail_pesanan to count sales for filtered orders
      const productIds = products.map((p) => p.id_produk);
      const orderIds = orders.map((o) => o.id_pesanan);

      if (orderIds.length === 0) {
        setTopProducts([]);
        return;
      }

      const { data: details } = await supabase
        .from("detail_pesanan")
        .select("id_produk, jumlah, id_pesanan")
        .in("id_produk", productIds)
        .in("id_pesanan", orderIds);

      const salesMap: Record<string, number> = {};
      for (const d of details ?? []) {
        salesMap[d.id_produk] = (salesMap[d.id_produk] || 0) + d.jumlah;
      }

      const sorted = products
        .map((p) => ({
          name: p.nama_produk,
          sold: salesMap[p.id_produk] || 0,
          price: Number(p.harga),
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 3);

      setTopProducts(sorted);
    };

    fetchTopProducts();
  }, [org?.id_toko, selectedProker, subTokoOptions, orders]);

  const prokerPerformance = useMemo(() => {
    if (selectedProker !== "all") return [];
    
    const performanceMap: Record<string, { name: string; revenue: number; orders: number }> = {};
    
    subTokoOptions.forEach((opt) => {
      if (opt.id !== "all") {
        performanceMap[opt.id] = { name: opt.name, revenue: 0, orders: 0 };
      }
    });

    filteredOrders.forEach((o) => {
      if (performanceMap[o.id_sub_toko]) {
        performanceMap[o.id_sub_toko].revenue += o.total_harga;
        performanceMap[o.id_sub_toko].orders += 1;
      }
    });

    return Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, selectedProker, subTokoOptions]);

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-slate-500">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Agregat</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau performa penjualan dan operasional proker Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none w-full sm:w-auto"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">1 Minggu Terakhir</option>
              <option value="30d">1 Bulan Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
          </div>

          {/* Proker Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedProker}
              onChange={(e) => setSelectedProker(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none w-full sm:w-auto"
            >
              {subTokoOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div
          key={`rev-${reportData.revenue}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            Total Pendapatan
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {formatRupiah(reportData.revenue)}
          </p>
        </motion.div>

        <motion.div
          key={`ord-${reportData.orders}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            Total Pesanan
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {reportData.orders}{" "}
            <span className="text-lg font-normal text-slate-400">
              transaksi
            </span>
          </p>
        </motion.div>

        <motion.div
          key={`aov-${reportData.aov}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            Rata-rata Nilai Pesanan
          </p>
          <p className="text-3xl font-bold text-slate-900">
            {formatRupiah(reportData.aov)}
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Visualization */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Tren Pesanan Harian
            </h2>
          </div>

          {reportData.chartData.every((d) => d.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Store className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Belum ada data pesanan</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {reportData.chartData.map((bar, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.value}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 50,
                      delay: i * 0.05,
                    }}
                    className="w-full bg-primary-100 hover:bg-primary-500 rounded-t-md relative group transition-colors cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none">
                      {bar.count} Pesanan
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs font-medium text-slate-400 px-2">
                {reportData.chartData.length > 0 && (
                  <>
                    <span>{reportData.chartData[0]?.label || ""}</span>
                    <span>
                      {reportData.chartData[Math.floor(reportData.chartData.length / 2)]?.label || ""}
                    </span>
                    <span>
                      {reportData.chartData[reportData.chartData.length - 1]?.label || ""}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Produk Terlaris
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Berdasarkan filter saat ini
            </p>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            {topProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <p className="text-sm">Belum ada data produk</p>
              </div>
            ) : (
              topProducts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.sold} Terjual
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatRupiah(item.price)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Laporan Tiap Proker (Hanya muncul jika Semua Proker dipilih) */}
      {selectedProker === "all" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-200 flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">Performa Tiap Proker</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Nama Proker</th>
                  <th className="p-4 font-medium text-right">Total Pesanan</th>
                  <th className="p-4 font-medium text-right">Total Pendapatan</th>
                  <th className="p-4 font-medium text-right">Rata-rata Nilai</th>
                </tr>
              </thead>
              <tbody>
                {prokerPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">
                      Belum ada data proker.
                    </td>
                  </tr>
                ) : (
                  prokerPerformance.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">{p.orders}</td>
                      <td className="p-4 text-sm font-semibold text-emerald-600 text-right">
                        {formatRupiah(p.revenue)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right">
                        {formatRupiah(p.orders > 0 ? p.revenue / p.orders : 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}