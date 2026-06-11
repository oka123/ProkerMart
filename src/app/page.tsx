"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, ShoppingBag, Store, Zap, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/explore/ProductCard";
import type { Product } from "@/lib/types/product";

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/products?limit=4&sort=terbaru");
        if (!res.ok) throw new Error("Failed to fetch products");
        const json = await res.json();
        setTrendingProducts(json.products || []);
      } catch (err) {
        console.error("Error fetching trending products:", err);
      } finally {
        setIsLoadingTrending(false);
      }
    }
    fetchTrending();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 lg:py-24 overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 dark:bg-primary-900/50 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-20 animate-blob"></div>
            <div className="absolute top-24 -left-24 w-96 h-96 bg-blue-200 dark:bg-blue-900/50 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-900/50 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 dark:opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm font-medium mb-8 transition-colors">
                  <span className="flex h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                  Platform Resmi Organisasi Mahasiswa
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-8 transition-colors">
                  Dukung Proker Kampus, <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-blue-500">
                    Lebih Mudah & Modern
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto transition-colors">
                  ProkerMart adalah ekosistem digital terpadu untuk jual-beli
                  program kerja mahasiswa. Temukan merchandise, makanan, dan
                  layanan dari berbagai organisasi dalam satu platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 dark:shadow-primary-900/20 transition-all hover:-translate-y-0.5"
                  >
                    Mulai Belanja
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-xl shadow-sm transition-all"
                  >
                    Daftarkan Organisasi
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 lg:py-24 bg-white dark:bg-slate-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">
                Mengapa Menggunakan ProkerMart?
              </h2>
              <p className="text-slate-600 dark:text-slate-400 transition-colors">
                Membawa transparansi dan efisiensi dalam transaksi kampus.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <Store className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                  ),
                  title: "Satu Platform, Banyak Toko",
                  desc: "Setiap organisasi memiliki etalase digital. Jelajahi berbagai produk tanpa harus mencari di berbagai grup chat.",
                },
                {
                  icon: (
                    <Zap className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                  ),
                  title: "Transaksi Digital Real-time",
                  desc: "Pembayaran QRIS dan transfer bank. Tidak ada lagi pencatatan manual yang rawan kesalahan.",
                },
                {
                  icon: (
                    <ShieldCheck className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                  ),
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
                  className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-primary-100 dark:hover:border-primary-700/50 hover:shadow-lg dark:hover:shadow-black/20 transition-all"
                >
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-6 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-12 md:py-20 lg:py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
                  Produk Trending🔥
                </h2>
                <p className="text-slate-600 dark:text-slate-400 transition-colors">
                  Paling banyak dipesan di kampus minggu ini.
                </p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:flex items-center text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Lihat Semua <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoadingTrending ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : trendingProducts.length > 0 ? (
                trendingProducts.map((product, i) => (
                  <ProductCard key={product.id_produk} product={product} index={i} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Belum ada produk.
                </div>
              )}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center text-primary-600 dark:text-primary-400 font-medium transition-colors"
              >
                Lihat Semua Produk <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Logo />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto transition-colors">
            Membangun ekosistem wirausaha mahasiswa yang modern, transparan, dan
            terstruktur.
          </p>
          <div className="text-sm text-slate-400 dark:text-slate-500 transition-colors">
            &copy; 2026 Kelompok 1. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
