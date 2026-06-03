"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Store,
  TrendingUp,
  Users,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function OrgDashboardPage() {
  const stats = [
    {
      name: "Total Pendapatan Organisasi",
      value: "Rp 12.850.000",
      change: "+24.5%",
      icon: TrendingUp,
    },
    {
      name: "Total Sub-Toko (Proker)",
      value: "5 Aktif",
      change: "1 Selesai",
      icon: Store,
    },
    {
      name: "Total Anggota Kepanitiaan",
      value: "145 Orang",
      change: "+12",
      icon: Users,
    },
    {
      name: "Total Pesanan Seluruh Proker",
      value: "432",
      change: "+18%",
      icon: Building2,
    },
  ];

  const subTokos = [
    {
      name: "Dies Natalis ke-30",
      status: "Aktif",
      revenue: "Rp 5.250.000",
      orders: 145,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "LKMM Dasar 2026",
      status: "Aktif",
      revenue: "Rp 3.100.000",
      orders: 89,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "Bakti Sosial Desa",
      status: "Aktif",
      revenue: "Rp 4.500.000",
      orders: 198,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      name: "Penyambutan Maba",
      status: "Selesai",
      revenue: "Rp 8.900.000",
      orders: 350,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Selamat datang, BEM FMIPA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ini adalah ringkasan performa seluruh program kerja Anda (KF-20:
            Rekap Toko Organisasi).
          </p>
        </div>
        <Link
          href="/org-dashboard/new-proker"
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          + Daftarkan Proker Baru
        </Link>
      </div>

      {/* Aggregate Stats Grid */}
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
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-3 h-3" />
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
        {/* Sub-Toko Performance List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Performa Sub-Toko (Proker)
            </h2>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
              Lihat Laporan Lengkap
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Nama Proker</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Pesanan</th>
                  <th className="px-6 py-4">Omzet Total</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subTokos.map((store, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {store.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${store.color}`}
                      >
                        {store.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {store.orders} Pesanan
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {store.revenue}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href="/dashboard"
                        className="inline-flex text-slate-400 group-hover:text-primary-600 transition-colors p-1 rounded-md hover:bg-primary-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Validation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Menunggu Tindakan
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Verifikasi Akun Proker
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Panitia &quot;Seminar Nasional&quot; meminta akses ke platform.
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg">
                    Setujui
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg">
                    Tolak
                  </button>
                </div>
              </div>
            </div>

            <button className="mt-auto w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Pusat Bantuan Organisasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
