"use client";

import { Navbar } from "@/components/Navbar";
import { Search, Store, Users, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock data based on ERD Organisasi & Toko
const mockOrganizations = [
  {
    id: "ORG001",
    name: "BEM FMIPA Unud",
    description:
      "Badan Eksekutif Mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Udayana.",
    verified: true,
    totalProker: 5,
    activeProducts: 24,
    color: "from-blue-500 to-cyan-500",
    initial: "BM",
  },
  {
    id: "ORG002",
    name: "HIMA TI Unud",
    description:
      "Himpunan Mahasiswa Teknologi Informasi. Mengelola seluruh kegiatan kemahasiswaan Prodi TI.",
    verified: true,
    totalProker: 3,
    activeProducts: 12,
    color: "from-emerald-500 to-teal-500",
    initial: "HT",
  },
  {
    id: "ORG003",
    name: "UKM Kesenian",
    description:
      "Unit Kegiatan Mahasiswa bidang kesenian daerah dan modern di tingkat Universitas.",
    verified: true,
    totalProker: 2,
    activeProducts: 8,
    color: "from-purple-500 to-pink-500",
    initial: "UK",
  },
  {
    id: "ORG004",
    name: "DPM Universitas",
    description: "Dewan Perwakilan Mahasiswa tingkat Universitas.",
    verified: false,
    totalProker: 1,
    activeProducts: 3,
    color: "from-amber-500 to-orange-500",
    initial: "DP",
  },
];

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Direktori{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-secondary-600">
              Organisasi
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Temukan dan dukung berbagai program kerja dari seluruh organisasi
            mahasiswa, himpunan, dan UKM yang ada di kampus.
          </p>

          <div className="max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama organisasi atau UKM..."
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Organization List */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockOrganizations.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/50 transition-all group relative overflow-hidden"
            >
              {/* Decorative top border */}
              <div
                className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r ${org.color}`}
              ></div>

              <div className="flex items-start gap-4 mb-4 mt-2">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl bg-linear-to-br ${org.color} shadow-sm shrink-0`}
                >
                  {org.initial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {org.name}
                    </h2>
                    {org.verified && (
                      <div
                        className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                        title="Terverifikasi Resmi"
                      >
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> Universitas
                  </p>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                {org.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Sub-Toko
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {org.totalProker}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Store className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Produk
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    {org.activeProducts}
                  </p>
                </div>
              </div>

              <Link
                href={`/explore?org=${org.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-50 text-primary-600 font-semibold rounded-xl hover:bg-primary-600 hover:text-white transition-colors"
              >
                Kunjungi Toko
                <ExternalLink className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
