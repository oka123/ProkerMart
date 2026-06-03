"use client";

import { motion } from "framer-motion";
import { Download, TrendingUp, Calendar, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Laporan Penjualan
          </h1>
          <p className="text-sm text-slate-500">
            Analisis dan unduh rekapitulasi penjualan proker Anda (KF-19).
          </p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV / PDF
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Ringkasan Keuangan
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Omzet Kotor</span>
              <span className="font-bold text-slate-900">Rp 4.250.000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Pembayaran QRIS</span>
              <span className="font-medium text-slate-900">Rp 3.100.000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Pembayaran Tunai</span>
              <span className="font-medium text-slate-900">Rp 1.150.000</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Produk Terlaris
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 font-bold text-slate-300 text-xl">1</div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">
                  Paket Nasi Ayam Geprek
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                  <div className="bg-primary-500 h-2 rounded-full w-[85%]"></div>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">85 terjual</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 font-bold text-slate-300 text-xl">2</div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">
                  Es Teh Manis Jumbo
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-2">
                  <div className="bg-primary-400 h-2 rounded-full w-[60%]"></div>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">60 terjual</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Grafik Penjualan Bulanan
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Visualisasi data akan aktif setelah sistem memiliki minimal 30 hari
          data transaksi historis.
        </p>
      </div>
    </div>
  );
}
