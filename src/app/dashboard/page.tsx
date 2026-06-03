"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Users,
  Activity,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      name: "Total Pendapatan",
      value: "Rp 4.250.000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      name: "Pesanan Masuk",
      value: "145",
      change: "+18.2%",
      trend: "up",
      icon: ShoppingBag,
    },
    {
      name: "Pembeli Unik",
      value: "89",
      change: "-2.4%",
      trend: "down",
      icon: Users,
    },
    {
      name: "Tingkat Konversi",
      value: "15.3%",
      change: "+4.1%",
      trend: "up",
      icon: Activity,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Ringkasan Performa
          </h1>
          <p className="text-sm text-slate-500">
            Pantau aktivitas penjualan proker Anda secara real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <select className="bg-white border border-slate-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
            <option>7 Hari Terakhir</option>
            <option>30 Hari Terakhir</option>
            <option>Bulan Ini</option>
          </select>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Pesanan Terbaru
            </h2>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">ID Pesanan</th>
                  <th className="px-6 py-3">Pembeli</th>
                  <th className="px-6 py-3">Produk</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    id: "#ORD-001",
                    buyer: "Budi Santoso",
                    product: "Paket Nasi Ayam (2)",
                    status: "Menunggu",
                    total: "Rp 30.000",
                  },
                  {
                    id: "#ORD-002",
                    buyer: "Siti Aminah",
                    product: "Kaos Dies Natalis (L)",
                    status: "Diproses",
                    total: "Rp 85.000",
                  },
                  {
                    id: "#ORD-003",
                    buyer: "Andi Wijaya",
                    product: "Gantungan Kunci",
                    status: "Selesai",
                    total: "Rp 10.000",
                  },
                  {
                    id: "#ORD-004",
                    buyer: "Dewi Lestari",
                    product: "Snack Box Rapat (5)",
                    status: "Selesai",
                    total: "Rp 60.000",
                  },
                ].map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{order.buyer}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.product}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === "Selesai"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "Diproses"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {order.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Jadwal Hari Ini
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="flex gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm mb-1">
                  Pre-order Ditutup
                </h3>
                <p className="text-xs text-amber-700">
                  Pre-order Batch 1 "Kaos Dies Natalis" akan ditutup dalam 3
                  jam.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-sm mb-1">
                  Jadwal Keliling
                </h3>
                <p className="text-xs text-blue-700">
                  Tim 2: Fakultas Teknik (13.00 - 15.00 WITA)
                </p>
              </div>
            </div>

            <button className="mt-auto w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Lihat Kalender Proker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
