"use client";

import { motion } from "framer-motion";
import { User, Store, Building2, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const roles = [
    {
      id: "pembeli",
      title: "Pembeli (Sivitas)",
      description:
        "Mahasiswa, dosen, atau staf yang ingin mencari dan membeli produk dari berbagai program kerja kampus.",
      icon: User,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      features: ["Pencarian Produk", "Checkout & Bayar", "Lacak Pesanan"],
      link: "/explore",
      linkText: "Masuk sebagai Pembeli",
    },
    {
      id: "proker",
      title: "Panitia Proker",
      description:
        "Pengelola Sub-Toko. Mengatur produk, memproses pesanan masuk, dan melihat laporan penjualan proker sendiri.",
      icon: Store,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      features: [
        "Kelola Stok Barang",
        "Konfirmasi Pesanan",
        "Dashboard Proker",
      ],
      link: "/dashboard",
      linkText: "Masuk ke Dashboard Proker",
    },
    {
      id: "organisasi",
      title: "Pengurus Organisasi",
      description:
        "BEM/HIMA/UKM pengelola Toko Induk. Mendaftarkan proker dan memantau total omzet seluruh kepanitiaan.",
      icon: Building2,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      features: ["Verifikasi Proker", "Laporan Agregat", "Manajemen Anggota"],
      link: "/org-dashboard",
      linkText: "Masuk ke Panel Organisasi",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-sm font-medium rounded-full bg-slate-100 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            Simulasi Role / Peran
          </div>
          <h1 className="mb-4 text-3xl font-extrabold md:text-5xl text-slate-900">
            Pilih Peran Anda
          </h1>
          <p className="text-lg text-slate-600">
            Sistem ProkerMart memisahkan hak akses dan antarmuka berdasarkan
            peran pengguna sesuai dengan dokumen SKPL. Silakan pilih peran di
            bawah ini untuk melihat perbedaannya.
          </p>
        </div>

        <div className="grid max-w-6xl gap-6 mx-auto md:grid-cols-3">
          {roles.map((role, i) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex flex-col p-8 overflow-hidden transition-all bg-white border shadow-sm rounded-3xl border-slate-200 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Decorative top gradient */}
                <div
                  className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r ${role.color}`}
                ></div>

                <div
                  className={`w-16 h-16 rounded-2xl ${role.bgColor} ${role.textColor} flex items-center justify-center mb-6`}
                >
                  <Icon className="w-8 h-8" />
                </div>

                <h2 className="mb-3 text-2xl font-bold text-slate-900">
                  {role.title}
                </h2>
                <p className="flex-1 mb-6 text-slate-600 line-clamp-3">
                  {role.description}
                </p>

                <div className="mb-8">
                  <h3 className="mb-3 text-sm font-bold tracking-wider uppercase text-slate-900">
                    Akses Utama:
                  </h3>
                  <ul className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full bg-linear-to-r ${role.color}`}
                        ></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={role.link}
                  className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-white shadow-md bg-linear-to-r ${role.color} hover:opacity-90 transition-opacity`}
                >
                  {role.linkText}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
