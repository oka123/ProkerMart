/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  Search,
  Store,
  Users,
  MapPin,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Organization = {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  totalProker: number;
  activeProducts: number;
  color: string;
  initial: string;
  tokoId: string | null;
};

const COLORS = [
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
  "from-indigo-500 to-blue-500",
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizations() {
      setIsLoading(true);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );

      try {
        const { data: orgData, error } = await supabase.from("organisasi")
          .select(`
            id_organisasi,
            nama_organisasi,
            status_verifikasi,
            toko (
              id_toko,
              deskripsi,
              sub_toko (
                id_sub_toko,
                produk ( id_produk )
              )
            )
          `);

        if (error) throw error;

        const formattedOrgs: Organization[] = (orgData || []).map(
          (org, index) => {
            const mainToko = Array.isArray(org.toko) ? org.toko[0] : org.toko;

            let totalProker = 0;
            let activeProducts = 0;
            let description = "Belum ada deskripsi organisasi.";

            if (mainToko) {
              description = mainToko.deskripsi || description;
              const subTokos = mainToko.sub_toko || [];
              totalProker = subTokos.length;

              subTokos.forEach((st: any) => {
                if (st.produk) {
                  activeProducts += st.produk.length;
                }
              });
            }

            // Compute initial
            const words = org.nama_organisasi.split(" ");
            let initial = org.nama_organisasi.substring(0, 2).toUpperCase();
            if (words.length > 1) {
              initial = (words[0][0] + words[1][0]).toUpperCase();
            }

            return {
              id: org.id_organisasi,
              name: org.nama_organisasi,
              description: description,
              verified: org.status_verifikasi === "verified",
              totalProker,
              activeProducts,
              color: COLORS[index % COLORS.length],
              initial,
              tokoId: mainToko ? mainToko.id_toko : null,
            };
          },
        );

        setOrganizations(formattedOrgs);
      } catch (err) {
        console.error("Error fetching organizations:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 py-12 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-extrabold md:text-5xl text-slate-900">
            Daftar{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-blue-600">
              Organisasi
            </span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-slate-600">
            Temukan dan dukung berbagai program kerja dari seluruh organisasi
            mahasiswa, himpunan, dan UKM yang ada di kampus.
          </p>

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama organisasi atau UKM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-4 pr-4 transition-all bg-white border shadow-sm outline-none pl-11 border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Organization List */}
      <main className="flex-1 w-full px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 mb-4 animate-spin text-primary-500" />
            <p>Memuat daftar organisasi...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="py-20 text-center bg-white border rounded-2xl border-slate-200">
            <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">
              Tidak Ada Organisasi
            </h3>
            <p className="text-slate-500">
              {searchQuery
                ? "Coba kata kunci pencarian yang lain."
                : "Belum ada organisasi yang terdaftar."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org, i) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex flex-col p-6 overflow-hidden transition-all bg-white border rounded-2xl border-slate-200 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/50 group"
              >
                {/* Decorative top border */}
                <div
                  className={`absolute top-0 left-0 w-full h-2 bg-linear-to-r ${org.color}`}
                ></div>

                <div className="flex items-start gap-4 mt-2 mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl bg-linear-to-br ${org.color} shadow-sm shrink-0`}
                  >
                    {org.initial}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 line-clamp-1">
                        {org.name}
                      </h2>
                      {org.verified && (
                        <div
                          className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full shrink-0"
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
                    <p className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                      <MapPin className="w-3 h-3" /> Universitas
                    </p>
                  </div>
                </div>

                <p className="flex-1 mb-6 text-sm text-slate-600 line-clamp-3">
                  {org.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 border bg-slate-50 rounded-xl border-slate-100">
                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-semibold tracking-wider uppercase">
                        Sub-Toko
                      </span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {org.totalProker}
                    </p>
                  </div>
                  <div className="p-3 border bg-slate-50 rounded-xl border-slate-100">
                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                      <Store className="w-4 h-4" />
                      <span className="text-xs font-semibold tracking-wider uppercase">
                        Produk
                      </span>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {org.activeProducts}
                    </p>
                  </div>
                </div>

                {org.tokoId ? (
                  <Link
                    href={`/organizations/${org.tokoId}`}
                    className="flex items-center justify-center w-full gap-2 py-3 font-semibold transition-colors bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white"
                  >
                    Kunjungi Toko
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center w-full gap-2 py-3 font-semibold cursor-not-allowed bg-slate-100 text-slate-400 rounded-xl"
                  >
                    Belum Memiliki Toko
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
