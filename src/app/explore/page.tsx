"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Search, Filter, ShoppingBag, MapPin, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock data based on ERD Produk & Sub_toko
const mockProducts = [
  {
    id: "P001",
    name: "Paket Nasi Ayam Geprek Level 3",
    price: 15000,
    orgName: "BEM FMIPA",
    prokerName: "Dies Natalis",
    tag: "Pre-order",
    tagColor: "bg-amber-100 text-amber-700",
    stock: 50,
    category: "Makanan",
  },
  {
    id: "P002",
    name: "Merchandise Kaos Dies Natalis (Hitam L)",
    price: 85000,
    orgName: "HIMA TI",
    prokerName: "IT Expo",
    tag: "Ready Stock",
    tagColor: "bg-emerald-100 text-emerald-700",
    stock: 12,
    category: "Pakaian",
  },
  {
    id: "P003",
    name: "Gantungan Kunci Kustom Akrilik",
    price: 10000,
    orgName: "UKM Kesenian",
    prokerName: "Pentas Seni",
    tag: "Pre-order",
    tagColor: "bg-amber-100 text-amber-700",
    stock: 100,
    category: "Merchandise",
  },
  {
    id: "P004",
    name: "Snack Box Rapat (Risoles, Lemper, Aqua)",
    price: 12000,
    orgName: "DPM Universitas",
    prokerName: "Raker Tahunan",
    tag: "Keliling",
    tagColor: "bg-blue-100 text-blue-700",
    stock: 30,
    category: "Makanan",
  },
  {
    id: "P005",
    name: "Lanyard Eksklusif Universitas",
    price: 25000,
    orgName: "BEM Universitas",
    prokerName: "Penyambutan Maba",
    tag: "Ready Stock",
    tagColor: "bg-emerald-100 text-emerald-700",
    stock: 80,
    category: "Merchandise",
  },
  {
    id: "P006",
    name: "Es Teh Manis Jumbo",
    price: 5000,
    orgName: "BEM FMIPA",
    prokerName: "Dies Natalis",
    tag: "Keliling",
    tagColor: "bg-blue-100 text-blue-700",
    stock: 100,
    category: "Minuman",
  },
];

const categories = [
  "Semua",
  "Makanan",
  "Minuman",
  "Pakaian",
  "Merchandise",
  "Jasa",
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  // Filtering logic
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.prokerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "Semua" || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header Search Section */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari produk, proker, atau organisasi..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-slate-900 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto flex gap-2">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                <Filter className="w-5 h-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 mt-6 pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product List */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Eksplor Produk
            </h1>
            <p className="text-slate-500">
              Menampilkan {filteredProducts.length} produk dari berbagai proker.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            Urutkan:
            <button className="font-semibold flex items-center hover:text-primary-600">
              Terbaru <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, i) => (
              <Link href={`/explore/${product.id}`} key={product.id}>
                <motion.div
                  /* key={product.id} --> Ini sudah kita hapus dan pindahkan ke atas */
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col h-full"
                >
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold w-fit ${product.tagColor}`}
                      >
                        {product.tag}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs font-semibold text-primary-600 mb-1 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3" />
                      {product.orgName} - {product.prokerName}
                    </p>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="mt-auto pt-4">
                      <p className="text-xs text-slate-500 mb-1">
                        Stok: {product.stock}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-primary-600 text-lg">
                          Rp {product.price.toLocaleString("id-ID")}
                        </span>
                        {/* Catatan: Karena sekarang dibungkus Link, jika tombol + ini diklik, pengunjung juga akan ikut masuk ke halaman detail. Kita bisa atur ini nanti! */}
                        <button className="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-slate-500">
              Coba gunakan kata kunci lain atau ubah filter kategori.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
