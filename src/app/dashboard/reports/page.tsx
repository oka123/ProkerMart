"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, TrendingUp, BarChart3, ShoppingBag, Wifi, WifiOff, Loader2, Calendar, Wallet, X, CreditCard, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useDashboard } from "@/lib/context/DashboardContext";

type RangeKey = "1d" | "1w" | "1m" | "3m" | "6m";

const RANGE_OPTIONS: { label: string; key: RangeKey }[] = [
  { label: "Hari Ini", key: "1d" },
  { label: "7 Hari", key: "1w" },
  { label: "1 Bulan", key: "1m" },
  { label: "3 Bulan", key: "3m" },
  { label: "6 Bulan", key: "6m" },
];

function getRangeStart(key: RangeKey): string {
  const now = new Date();
  switch (key) {
    case "1d": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.toISOString();
    }
    case "1w": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "1m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "3m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "6m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
  }
}

// How many chart buckets and their label format per range
function buildChartBuckets(key: RangeKey): { key: string; label: string; online: number; offline: number }[] {
  const now = new Date();
  const buckets: { key: string; label: string; online: number; offline: number }[] = [];

  if (key === "1d") {
    // Hourly buckets for today
    for (let h = 0; h < 24; h++) {
      buckets.push({ key: String(h).padStart(2, "0"), label: `${String(h).padStart(2, "0")}:00`, online: 0, offline: 0 });
    }
  } else if (key === "1w") {
    // Daily for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      buckets.push({ key: k, label, online: 0, offline: 0 });
    }
  } else if (key === "1m") {
    // Daily for last 30 days, show every 5th label
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      const label = i % 5 === 0 ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "";
      buckets.push({ key: k, label, online: 0, offline: 0 });
    }
  } else {
    // Monthly buckets for 3m or 6m
    const months = key === "3m" ? 3 : 6;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      buckets.push({ key: k, label, online: 0, offline: 0 });
    }
  }
  return buckets;
}

function getBucketKey(dateStr: string, rangeKey: RangeKey): string {
  if (rangeKey === "1d") return dateStr.slice(11, 13); // "HH"
  if (rangeKey === "1w" || rangeKey === "1m") return dateStr.slice(0, 10); // "YYYY-MM-DD"
  return dateStr.slice(0, 7); // "YYYY-MM"
}

interface SummaryData {
  omzetOnline: number;
  omzetOffline: number;
  countOnline: number;
  countOffline: number;
  byMethod: { qris: number; transfer: number; tunai: number };
}

interface TopProduct {
  id_produk: string;
  nama_produk: string;
  totalTerjual: number;
  totalOmzet: number;
}

interface Penarikan {
  id: string;
  jumlah: number;
  nama_bank: string;
  no_rekening: string;
  nama_pemilik: string;
  tgl_tarik: string;
}

export default function ReportsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { active } = useDashboard();
  const subTokoId = active?.id_sub_toko ?? null;
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [range, setRange] = useState<RangeKey>("1m");
  const [summary, setSummary] = useState<SummaryData>({
    omzetOnline: 0, omzetOffline: 0, countOnline: 0, countOffline: 0,
    byMethod: { qris: 0, transfer: 0, tunai: 0 },
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [chartBuckets, setChartBuckets] = useState(buildChartBuckets("1m"));
  const [penarikanList, setPenarikanList] = useState<Penarikan[]>([]);
  const [totalDitarik, setTotalDitarik] = useState(0);
  const [allTimeOmzet, setAllTimeOmzet] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [form, setForm] = useState({ jumlah: "", nama_bank: "", no_rekening: "", nama_pemilik: "" });
  const [formError, setFormError] = useState("");

  const fetchSaldo = useCallback(async (stId: string) => {
    try {
      const [omzetOnlineRes, omzetOfflineRes, penarikanRes] = await Promise.all([
        supabase.from("pesanan").select("total_harga").eq("id_sub_toko", stId).eq("status_pesanan", "selesai"),
        supabase.from("rekap_jualan_offline").select("total_harga").eq("id_sub_toko", stId),
        supabase.from("penarikan_saldo").select("*").eq("id_sub_toko", stId).order("tgl_tarik", { ascending: false }),
      ]);
      const omzet = (omzetOnlineRes.data ?? []).reduce((s: number, p: any) => s + Number(p.total_harga), 0)
        + (omzetOfflineRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_harga), 0);
      const ditarik = (penarikanRes.data ?? []).reduce((s: number, p: any) => s + Number(p.jumlah), 0);
      setAllTimeOmzet(omzet);
      setTotalDitarik(ditarik);
      setPenarikanList(penarikanRes.data ?? []);
    } catch (err) {
      console.error("[ReportsPage - fetchSaldo] Error:", err);
    }
  }, [supabase]);

  const handleWithdraw = async () => {
    if (!subTokoId) return;
    const jumlah = Number(form.jumlah);
    const saldo = allTimeOmzet - totalDitarik;
    if (!jumlah || jumlah <= 0) { setFormError("Nominal harus lebih dari 0."); return; }
    if (jumlah > saldo) { setFormError("Nominal melebihi saldo tersedia."); return; }
    if (!form.nama_bank.trim() || !form.no_rekening.trim() || !form.nama_pemilik.trim()) {
      setFormError("Lengkapi semua data rekening.");
      return;
    }
    setFormError("");
    setWithdrawLoading(true);
    try {
      const { error } = await supabase.from("penarikan_saldo").insert({
        id_sub_toko: subTokoId,
        jumlah,
        nama_bank: form.nama_bank.trim(),
        no_rekening: form.no_rekening.trim(),
        nama_pemilik: form.nama_pemilik.trim(),
      });
      if (error) throw error;
      setShowModal(false);
      setForm({ jumlah: "", nama_bank: "", no_rekening: "", nama_pemilik: "" });
      await fetchSaldo(subTokoId);
    } catch (err) {
      console.error("[ReportsPage - handleWithdraw] Error:", err);
      setFormError("Gagal menyimpan penarikan. Coba lagi.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const fetchData = useCallback(async (stId: string, rangeKey: RangeKey) => {
    setDataLoading(true);
    const since = getRangeStart(rangeKey);
    try {
      const [pesananRes, rekapRes] = await Promise.all([
        supabase
          .from("pesanan")
          .select(`
            id_pesanan, total_harga, tgl_pesan,
            pembayaran(metode_pembayaran, status_bayar),
            detail_pesanan(jumlah, sub_total, id_produk, produk(nama_produk))
          `)
          .eq("id_sub_toko", stId)
          .eq("status_pesanan", "selesai")
          .gte("tgl_pesan", since),
        supabase
          .from("rekap_jualan_offline")
          .select("id, total_harga, jumlah_item, tanggal, id_produk, metode_pembayaran, produk(nama_produk)")
          .eq("id_sub_toko", stId)
          .gte("tanggal", since.slice(0, 10)),
      ]);

      const pesananList: any[] = pesananRes.data ?? [];
      const rekapList: any[] = rekapRes.data ?? [];

      // Summary
      const omzetOnline = pesananList.reduce((s, p) => s + Number(p.total_harga), 0);
      const omzetOffline = rekapList.reduce((s, r) => s + Number(r.total_harga), 0);
      const byMethod = { qris: 0, transfer: 0, tunai: 0 };
      pesananList.forEach((p) => {
        const bayar = p.pembayaran;
        if (bayar?.status_bayar === "dibayar") {
          const m = bayar.metode_pembayaran as keyof typeof byMethod;
          if (m in byMethod) byMethod[m] += Number(p.total_harga);
        }
      });
      rekapList.forEach((r) => {
        const m = r.metode_pembayaran as keyof typeof byMethod;
        if (m && m in byMethod) byMethod[m] += Number(r.total_harga);
      });
      setSummary({ omzetOnline, omzetOffline, countOnline: pesananList.length, countOffline: rekapList.length, byMethod });

      // Top products
      const produkMap: Record<string, TopProduct> = {};
      pesananList.forEach((p) => {
        (p.detail_pesanan ?? []).forEach((d: any) => {
          if (!d.id_produk) return;
          if (!produkMap[d.id_produk]) produkMap[d.id_produk] = { id_produk: d.id_produk, nama_produk: d.produk?.nama_produk ?? "—", totalTerjual: 0, totalOmzet: 0 };
          produkMap[d.id_produk].totalTerjual += Number(d.jumlah);
          produkMap[d.id_produk].totalOmzet += Number(d.sub_total);
        });
      });
      rekapList.forEach((r) => {
        if (!r.id_produk) return;
        if (!produkMap[r.id_produk]) produkMap[r.id_produk] = { id_produk: r.id_produk, nama_produk: r.produk?.nama_produk ?? "—", totalTerjual: 0, totalOmzet: 0 };
        produkMap[r.id_produk].totalTerjual += Number(r.jumlah_item);
        produkMap[r.id_produk].totalOmzet += Number(r.total_harga);
      });
      setTopProducts(Object.values(produkMap).sort((a, b) => b.totalTerjual - a.totalTerjual).slice(0, 5));

      // Chart buckets
      const buckets = buildChartBuckets(rangeKey);
      pesananList.forEach((p) => {
        const k = getBucketKey(p.tgl_pesan, rangeKey);
        const b = buckets.find((b) => b.key === k);
        if (b) b.online += Number(p.total_harga);
      });
      rekapList.forEach((r) => {
        const dateStr = rangeKey === "1d" ? `T${r.tanggal}` : r.tanggal;
        const k = getBucketKey(rangeKey === "1d" ? new Date(r.tanggal).toISOString() : r.tanggal, rangeKey);
        const b = buckets.find((b) => b.key === k);
        if (b) b.offline += Number(r.total_harga);
      });
      setChartBuckets(buckets);
    } catch (err) {
      console.error("[ReportsPage] Error:", err);
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    setInitialLoading(false);
    if (subTokoId) {
      fetchData(subTokoId, range);
      fetchSaldo(subTokoId);
    }
  }, [subTokoId, range, fetchData, fetchSaldo]);

  const totalOmzet = summary.omzetOnline + summary.omzetOffline;
  const maxChart = Math.max(...chartBuckets.map((b) => b.online + b.offline), 1);
  const maxProduct = topProducts[0]?.totalTerjual ?? 1;

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Penjualan</h1>
          <p className="text-sm text-slate-500">Rekapitulasi penjualan online dan offline sub-toko Anda.</p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Range Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              range === opt.key
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {dataLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-500 ml-1" />}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Omzet", value: `Rp ${totalOmzet.toLocaleString("id-ID")}`, sub: "Online + Offline", color: "text-primary-600" },
          { label: "Omzet Online", value: `Rp ${summary.omzetOnline.toLocaleString("id-ID")}`, sub: `${summary.countOnline} pesanan selesai`, color: "text-emerald-600" },
          { label: "Omzet Offline", value: `Rp ${summary.omzetOffline.toLocaleString("id-ID")}`, sub: `${summary.countOffline} rekap`, color: "text-amber-600" },
          { label: "Produk Terjual", value: topProducts.reduce((s, p) => s + p.totalTerjual, 0).toString(), sub: `${topProducts.length} jenis produk`, color: "text-violet-600" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Saldo & Penarikan */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 rounded-2xl shadow-sm text-white flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 opacity-80" />
              <p className="text-sm opacity-80">Saldo Tersedia</p>
            </div>
            <p className="text-2xl font-black">Rp {(allTimeOmzet - totalDitarik).toLocaleString("id-ID")}</p>
            <p className="text-xs opacity-60 mt-0.5">Total omzet – sudah ditarik</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setFormError(""); }}
            className="shrink-0 bg-white text-primary-700 hover:bg-primary-50 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            Tarik Uang
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">Riwayat Penarikan</p>
          </div>
          {penarikanList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Belum ada penarikan.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {penarikanList.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Rp {Number(p.jumlah).toLocaleString("id-ID")}</p>
                    <p className="text-[10px] text-slate-400">{p.nama_bank} · {p.no_rekening} · {p.nama_pemilik}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Cair</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.tgl_tarik).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Tarik Uang */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Tarik Uang</h2>
                    <p className="text-xs text-slate-400">Saldo: Rp {(allTimeOmzet - totalDitarik).toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    min={1}
                    max={allTimeOmzet - totalDitarik}
                    value={form.jumlah}
                    onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
                    placeholder="Contoh: 500000"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nama Bank</label>
                  <input
                    type="text"
                    value={form.nama_bank}
                    onChange={(e) => setForm((f) => ({ ...f, nama_bank: e.target.value }))}
                    placeholder="Contoh: BCA, BRI, Mandiri"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={form.no_rekening}
                    onChange={(e) => setForm((f) => ({ ...f, no_rekening: e.target.value }))}
                    placeholder="1234567890"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={form.nama_pemilik}
                    onChange={(e) => setForm((f) => ({ ...f, nama_pemilik: e.target.value }))}
                    placeholder="Sesuai nama di rekening"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Batal
                </button>
                <button onClick={handleWithdraw} disabled={withdrawLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  {withdrawLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tarik Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Ringkasan Keuangan */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Ringkasan Keuangan</h2>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600 text-sm flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-500" /> Online (Platform)</span>
              <span className="font-bold text-slate-900 text-sm">Rp {summary.omzetOnline.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600 text-sm flex items-center gap-2"><WifiOff className="w-4 h-4 text-amber-500" /> Offline (Keliling)</span>
              <span className="font-bold text-slate-900 text-sm">Rp {summary.omzetOffline.toLocaleString("id-ID")}</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 pt-2 pb-1 uppercase tracking-wide">Per Metode Pembayaran</p>
            {[
              { label: "QRIS", value: summary.byMethod.qris, color: "bg-purple-100 text-purple-700" },
              { label: "Transfer", value: summary.byMethod.transfer, color: "bg-blue-100 text-blue-700" },
              { label: "Tunai / COD", value: summary.byMethod.tunai, color: "bg-emerald-100 text-emerald-700" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600 text-sm">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${row.color}`}>{row.label}</span>
                </span>
                <span className="font-medium text-slate-900 text-sm">Rp {row.value.toLocaleString("id-ID")}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 font-bold pt-3">
              <span className="text-slate-900">Total Omzet</span>
              <span className="text-primary-600">Rp {totalOmzet.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </motion.div>

        {/* Produk Terlaris */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Produk Terlaris</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Belum ada data produk terjual.</div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id_produk} className="flex items-center gap-4">
                  <div className="w-7 font-bold text-slate-300 text-xl shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{p.nama_produk}</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5">
                      <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${(p.totalTerjual / maxProduct) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-700 shrink-0">{p.totalTerjual} terjual</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Grafik */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Grafik Omzet — {RANGE_OPTIONS.find((o) => o.key === range)?.label}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-2 rounded-sm bg-primary-500 inline-block" /> Online</span>
              <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Offline</span>
            </div>
          </div>
        </div>
        {chartBuckets.every((b) => b.online === 0 && b.offline === 0) ? (
          <div className="text-center py-8 text-slate-400 text-sm">Belum ada transaksi dalam periode ini.</div>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto">
            {chartBuckets.map((b) => {
              const onlinePct = (b.online / maxChart) * 100;
              const offlinePct = (b.offline / maxChart) * 100;
              return (
                <div key={b.key} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "110px" }}>
                    <div className="w-full bg-amber-400 rounded-t-sm" style={{ height: `${offlinePct}%` }} title={`Offline: Rp ${b.offline.toLocaleString("id-ID")}`} />
                    <div className="w-full bg-primary-500 rounded-t-sm" style={{ height: `${onlinePct}%` }} title={`Online: Rp ${b.online.toLocaleString("id-ID")}`} />
                  </div>
                  {b.label && <p className="text-[9px] text-slate-400 text-center leading-tight whitespace-nowrap">{b.label}</p>}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
