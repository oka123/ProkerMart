"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, ShoppingBag, Store, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-24 -left-24 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-sm font-medium mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
                  Platform Resmi Organisasi Mahasiswa
                </span>
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-100 tracking-tight mb-8">
                  Dukung Proker Kampus, <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-secondary-500">
                    Lebih Mudah & Modern
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
                  ProkerMart adalah ekosistem digital terpadu untuk jual-beli
                  program kerja mahasiswa. Temukan merchandise, makanan, dan
                  layanan dari berbagai organisasi dalam satu platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5"
                  >
                    Mulai Belanja
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    href="/register-organization"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-700 bg-white border border-slate-200 hover:border-primary-200 hover:bg-primary-50 rounded-xl shadow-sm transition-all"
                  >
                    Daftarkan Organisasi
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Mengapa Menggunakan ProkerMart?
              </h2>
              <p className="text-slate-600">
                Membawa transparansi dan efisiensi dalam transaksi kampus.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Store className="w-8 h-8 text-primary-500" />,
                  title: "Satu Platform, Banyak Toko",
                  desc: "Setiap organisasi memiliki etalase digital. Jelajahi berbagai produk tanpa harus mencari di berbagai grup chat.",
                },
                {
                  icon: <Zap className="w-8 h-8 text-secondary-500" />,
                  title: "Transaksi Digital Real-time",
                  desc: "Pembayaran QRIS dan transfer bank. Tidak ada lagi pencatatan manual yang rawan kesalahan.",
                },
                {
                  icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                  title: "Laporan Terstruktur",
                  desc: "Dashboard khusus untuk memantau omzet, pesanan, dan performa setiap program kerja secara otomatis.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-100 hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Produk Trending🔥
                </h2>
                <p className="text-slate-600">
                  Paling banyak dipesan di kampus minggu ini.
                </p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Lihat Semua <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: "Paket Nasi Ayam Geprek",
                  org: "BEM FMIPA",
                  price: "Rp 15.000",
                  tag: "Pre-order",
                  tagColor: "bg-amber-100 text-amber-700",
                },
                {
                  name: "Merchandise Kaos Dies Natalis",
                  org: "HIMA TI",
                  price: "Rp 85.000",
                  tag: "Ready Stock",
                  tagColor: "bg-emerald-100 text-emerald-700",
                },
                {
                  name: "Gantungan Kunci Kustom",
                  org: "UKM Kesenian",
                  price: "Rp 10.000",
                  tag: "Pre-order",
                  tagColor: "bg-amber-100 text-amber-700",
                },
                {
                  name: "Snack Box Rapat",
                  org: "DPM Universitas",
                  price: "Rp 12.000",
                  tag: "Keliling",
                  tagColor: "bg-blue-100 text-blue-700",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group cursor-pointer"
                >
                  <div className="aspect-4/3 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {/* Placeholder for image */}
                    <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${item.tagColor}`}
                      >
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {item.org}
                    </p>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-extrabold text-primary-600">
                        {item.price}
                      </span>
                      <button className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center text-primary-600 font-medium"
              >
                Lihat Semua Produk <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-linear-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-bold text-xl text-slate-900">ProkerMart</span>
          </div>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Membangun ekosistem wirausaha mahasiswa yang modern, transparan, dan
            terstruktur.
          </p>
          <div className="text-sm text-slate-400">
            &copy; 2026 Kelompok 1. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
