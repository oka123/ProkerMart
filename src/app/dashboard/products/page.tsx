"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  PackageSearch,
  Tag,
  Image as ImageIcon,
} from "lucide-react";

export default function ProductsPage() {
  const [products] = useState([
    {
      id: "P001",
      name: "Paket Nasi Ayam Geprek Level 3",
      price: 15000,
      stock: 50,
      category: "Makanan",
      status: "Aktif",
    },
    {
      id: "P002",
      name: "Es Teh Manis Jumbo",
      price: 5000,
      stock: 100,
      category: "Minuman",
      status: "Aktif",
    },
    {
      id: "P003",
      name: "Kaos Panitia Dies Natalis (L)",
      price: 85000,
      stock: 0,
      category: "Pakaian",
      status: "Habis",
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Katalog Produk</h1>
          <p className="text-sm text-slate-500">
            Kelola daftar produk, stok, dan harga untuk etalase proker Anda.
          </p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama produk..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option>Semua Kategori</option>
            <option>Makanan</option>
            <option>Pakaian</option>
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Produk Info</th>
              <th className="px-6 py-4">Harga</th>
              <th className="px-6 py-4">Stok</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product, i) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hover:bg-slate-50 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Tag className="w-3 h-3" /> {product.category}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  Rp {product.price.toLocaleString("id-ID")}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`font-semibold ${product.stock > 0 ? "text-slate-700" : "text-red-600"}`}
                  >
                    {product.stock} pcs
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      product.status === "Aktif"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
