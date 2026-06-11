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
              verified: org.status_verifikasi === "Disetujui",
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Daftar{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-blue-600">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Organization List */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" />
            <p>Memuat daftar organisasi...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org, i) => (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/50 transition-all group relative overflow-hidden flex flex-col"
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
                      <h2 className="text-lg font-bold text-slate-900 line-clamp-1">
                        {org.name}
                      </h2>
                      {org.verified && (
                        <div
                          className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shrink-0"
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

                <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-1">
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

                {org.tokoId ? (
                  <Link
                    href={`/organizations/${org.tokoId}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary-50 text-primary-600 font-semibold rounded-xl hover:bg-primary-600 hover:text-white transition-colors"
                  >
                    Kunjungi Toko
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed"
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
