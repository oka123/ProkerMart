"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ArrowRight, Store, Zap, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ProductCard } from "@/components/explore/ProductCard";
import type { Product } from "@/lib/types/product";
import { createClient } from "@/lib/supabase/client";
import { fetchUserAccess } from "@/lib/auth-access";

export default function Home() {
  const router = useRouter();
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const access = await fetchUserAccess(supabase, user.email!);
      const targetRoute = access?.needsSelection ? "/auth/select-role" : "/explore";
      router.push(targetRoute);
    });
  }, [router]);

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
      <main className="flex flex-col flex-1">
        {/* Hero Section */}
        <section className="relative py-12 overflow-hidden md:py-20 lg:py-24">
          {/* Background Decorations */}
          <div className="absolute top-0 w-full h-full -translate-x-1/2 pointer-events-none left-1/2 max-w-7xl">
            <div className="absolute rounded-full opacity-50 -top-24 -right-24 w-96 h-96 bg-primary-200 dark:bg-primary-900/50 mix-blend-multiply dark:mix-blend-screen filter blur-3xl dark:opacity-20 animate-blob"></div>
            <div className="absolute bg-blue-200 rounded-full opacity-50 top-24 -left-24 w-96 h-96 dark:bg-blue-900/50 mix-blend-multiply dark:mix-blend-screen filter blur-3xl dark:opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bg-blue-200 rounded-full opacity-50 -bottom-8 left-1/2 w-96 h-96 dark:bg-blue-900/50 mix-blend-multiply dark:mix-blend-screen filter blur-3xl dark:opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium transition-colors border rounded-full bg-primary-50 dark:bg-primary-900/30 border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400">
                  <span className="flex w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                  Platform Resmi Organisasi Mahasiswa
                </span>
                <h1 className="mb-8 text-5xl font-extrabold tracking-tight transition-colors md:text-6xl lg:text-7xl text-slate-900 dark:text-slate-100">
                  Dukung Proker Kampus, <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-blue-500">
                    Lebih Mudah & Modern
                  </span>
                </h1>
                <p className="max-w-2xl mx-auto mb-8 text-lg leading-relaxed transition-colors lg:text-xl text-slate-600 dark:text-slate-300">
                  ProkerMart adalah ekosistem digital terpadu untuk jual-beli
                  program kerja mahasiswa. Temukan merchandise, makanan, dan
                  layanan dari berbagai organisasi dalam satu platform.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/explore"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 dark:shadow-primary-900/20 transition-all hover:-translate-y-0.5"
                  >
                    Mulai Belanja
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium transition-all bg-white border shadow-sm text-slate-700 dark:text-slate-200 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-xl"
                  >
                    Daftarkan Organisasi
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 transition-colors bg-white md:py-20 lg:py-24 dark:bg-slate-900">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold transition-colors text-slate-900 dark:text-white">
                Mengapa Menggunakan ProkerMart?
              </h2>
              <p className="transition-colors text-slate-600 dark:text-slate-400">
                Membawa transparansi dan efisiensi dalam transaksi kampus.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
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
                  className="p-8 transition-all border rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:border-primary-100 dark:hover:border-primary-700/50 hover:shadow-lg dark:hover:shadow-black/20"
                >
                  <div className="flex items-center justify-center w-16 h-16 mb-6 transition-colors bg-white shadow-sm dark:bg-slate-800 rounded-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold transition-colors text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed transition-colors text-slate-600 dark:text-slate-400">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section className="py-12 transition-colors md:py-20 lg:py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="mb-2 text-3xl font-bold transition-colors text-slate-900 dark:text-white">
                  Produk Terbaru
                </h2>
                <p className="transition-colors text-slate-600 dark:text-slate-400">
                  Produk yang baru saja ditambahkan.
                </p>
              </div>
              <Link
                href="/explore"
                className="items-center hidden font-medium transition-colors sm:flex text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {isLoadingTrending ? (
                <div className="flex justify-center py-12 col-span-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : trendingProducts.length > 0 ? (
                trendingProducts.map((product, i) => (
                  <ProductCard
                    key={product.id_produk}
                    product={product}
                    index={i}
                  />
                ))
              ) : (
                <div className="py-12 text-center col-span-full text-slate-500">
                  Belum ada produk.
                </div>
              )}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/explore"
                className="inline-flex items-center font-medium transition-colors text-primary-600 dark:text-primary-400"
              >
                Lihat Semua Produk <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 transition-colors bg-white border-t dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo />
          </div>
          <p className="max-w-md mx-auto mb-8 transition-colors text-slate-500 dark:text-slate-400">
            Membangun ekosistem wirausaha mahasiswa yang modern, transparan, dan
            terstruktur.
          </p>
          <div className="text-sm transition-colors text-slate-400 dark:text-slate-500">
            &copy; 2026 Kelompok 1. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
