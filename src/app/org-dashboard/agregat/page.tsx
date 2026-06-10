"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Filter, 
  Calendar, 
  TrendingUp, 
  ShoppingCart, 
  CreditCard,
  BarChart3,
  Download
} from "lucide-react";

// Mock Data
const prokerOptions = [
  { id: "all", name: "Semua Proker" },
  { id: "dies-natalis", name: "Dies Natalis ke-30" },
  { id: "lkmm", name: "LKMM Dasar 2026" },
  { id: "baksos", name: "Bakti Sosial Desa" },
];

const timeOptions = [
  { id: "week", name: "1 Minggu Terakhir" },
  { id: "month", name: "1 Bulan Terakhir" },
  { id: "year", name: "1 Tahun Terakhir" },
];

export default function ReportsPage() {
  const [selectedProker, setSelectedProker] = useState("all");
  const [selectedTime, setSelectedTime] = useState("month");

  // Kalkulasi data dummy agar reaktif saat filter diubah
  const reportData = useMemo(() => {
    let multiplier = 1;
    if (selectedTime === "week") multiplier = 0.25;
    if (selectedTime === "year") multiplier = 12;

    let prokerShare = 1;
    if (selectedProker === "dies-natalis") prokerShare = 0.5;
    if (selectedProker === "lkmm") prokerShare = 0.3;
    if (selectedProker === "baksos") prokerShare = 0.2;

    const baseRevenue = 15000000;
    const baseOrders = 450;
    const baseAOV = 33000;

    return {
      revenue: Math.round(baseRevenue * multiplier * prokerShare),
      orders: Math.round(baseOrders * multiplier * prokerShare),
      aov: baseAOV + 2500, // Average Order Value
      growth: selectedTime === "year" ? "+45%" : selectedTime === "week" ? "+5%" : "+12%",
      chartData: Array.from({ length: 7 }).map((_, i) => Math.floor(20 + (i * 37) % 80))
    };
  }, [selectedProker, selectedTime]);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Agregat</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau performa penjualan dan operasional proker Anda.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
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
              {prokerOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* Time Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none w-full sm:w-auto"
            >
              {timeOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Unduh CSV
          </button>
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
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
              {reportData.growth}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pendapatan</p>
          <p className="text-3xl font-bold text-slate-900">{formatRupiah(reportData.revenue)}</p>
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
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold text-slate-900">{reportData.orders} <span className="text-lg font-normal text-slate-400">transaksi</span></p>
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
          <p className="text-sm font-medium text-slate-500 mb-1">Rata-rata Nilai Pesanan</p>
          <p className="text-3xl font-bold text-slate-900">{formatRupiah(reportData.aov)}</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Simple Chart Visualization */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Tren Pendapatan ({timeOptions.find(t => t.id === selectedTime)?.name})
            </h2>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {reportData.chartData.map((val, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{ type: "spring", stiffness: 50, delay: i * 0.05 }}
                className="w-full bg-primary-100 hover:bg-primary-500 rounded-t-md relative group transition-colors cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none">
                  {val * 10} Transaksi
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-slate-400 px-2">
            <span>Awal Periode</span>
            <span>Tengah Periode</span>
            <span>Akhir Periode</span>
          </div>
        </div>

        {/* Top Selling Items (Mock) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Produk Terlaris</h2>
            <p className="text-xs text-slate-500 mt-1">Berdasarkan filter saat ini</p>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            {[
              { name: "Tiket Seminar VIP", sold: Math.round(reportData.orders * 0.4), price: "Rp 150.000" },
              { name: "Merchandise Kaos", sold: Math.round(reportData.orders * 0.25), price: "Rp 85.000" },
              { name: "Gantungan Kunci", sold: Math.round(reportData.orders * 0.15), price: "Rp 15.000" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sold} Terjual</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{item.price}</span>
              </div>
            ))}
            
            <button className="mt-auto w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              Lihat Semua Produk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}