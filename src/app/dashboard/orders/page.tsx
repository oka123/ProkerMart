"use client";

import { motion } from "framer-motion";
import { Check, X, Search, Filter, AlertCircle } from "lucide-react";

export default function OrdersPage() {
  const orders = [
    {
      id: "ORD-2026-001",
      buyer: "I Putu Arya Wisnu",
      items: "Paket Nasi Ayam Geprek (2x)",
      total: 30000,
      method: "QRIS",
      type: "Keliling",
      status: "Menunggu Konfirmasi",
    },
    {
      id: "ORD-2026-002",
      buyer: "Dewa Made Pradnyana",
      items: "Es Teh Manis Jumbo (1x)",
      total: 5000,
      method: "Tunai",
      type: "Pickup",
      status: "Diproses",
    },
    {
      id: "ORD-2026-003",
      buyer: "I Gusti Ayu Agung",
      items: "Kaos Panitia Dies Natalis (1x)",
      total: 85000,
      method: "Transfer",
      type: "Pre-order",
      status: "Selesai",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Masuk</h1>
          <p className="text-sm text-slate-500">
            Kelola dan verifikasi pesanan dari pembeli (KF-16).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">1 Pesanan Baru</h3>
            <p className="text-xs text-amber-700">
              Perlu konfirmasi pembayaran QRIS.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ID pesanan atau nama..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filter Status
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">ID Pesanan</th>
              <th className="px-6 py-4">Informasi Pembeli</th>
              <th className="px-6 py-4">Detail Order</th>
              <th className="px-6 py-4">Pembayaran</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order, i) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                  {order.id}
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{order.buyer}</p>
                  <p className="text-xs text-slate-500">{order.type}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-700">{order.items}</p>
                  <p className="font-bold text-primary-600 mt-1">
                    Rp {order.total.toLocaleString("id-ID")}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                      order.method === "QRIS"
                        ? "bg-purple-100 text-purple-700"
                        : order.method === "Tunai"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {order.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                <td className="px-6 py-4 text-right">
                  {order.status === "Menunggu Konfirmasi" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded transition-colors"
                        title="Terima Pesanan"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded transition-colors"
                        title="Tolak Pesanan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button className="text-sm text-primary-600 font-medium hover:underline">
                      Detail
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
