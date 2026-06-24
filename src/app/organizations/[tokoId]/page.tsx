"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft,
  MapPin,
  Store,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type TokoDetail = {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  organisasiName: string;
  subTokos: any[];
  allProducts: any[];
};

function TokoDetailContent() {
  const params = useParams();
  const router = useRouter();
  const tokoId = params.tokoId as string;

  const [toko, setToko] = useState<TokoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTokoDetail() {
      if (!tokoId) return;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );

      try {
        const { data, error } = await supabase
          .from("toko")
          .select(
            `
            id_toko,
            nama_toko,
            deskripsi,
            logo,
            organisasi ( nama_organisasi ),
            sub_toko (
              id_sub_toko,
              nama_proker,
              deskripsi,
              foto_sampul,
              produk (
                id_produk,
                nama_produk,
                harga,
                foto,
                kategori,
                stok
              )
            )
          `,
          )
          .eq("id_toko", tokoId)
          .single();

        if (error) throw error;
        if (!data) {
          router.push("/organizations");
          return;
        }

        const org = Array.isArray(data.organisasi)
          ? data.organisasi[0]
          : data.organisasi;
        const subTokos = data.sub_toko || [];

        // Aggregate all products
        let allProducts: any[] = [];
        subTokos.forEach((st: any) => {
          if (st.produk) {
            const mappedProducts = st.produk.map((p: any) => ({
              ...p,
              subTokoId: st.id_sub_toko,
              subTokoName: st.nama_proker,
            }));
            allProducts = [...allProducts, ...mappedProducts];
          }
        });

        setToko({
          id: data.id_toko,
          name: data.nama_toko,
          description: data.deskripsi || "Belum ada deskripsi",
          logo: data.logo,
          organisasiName: org ? org.nama_organisasi : "Unknown",
          subTokos: subTokos,
          allProducts: allProducts,
        });
      } catch (error) {
        console.error("Error fetching toko details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokoDetail();
  }, [tokoId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!toko) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Store className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Toko Tidak Ditemukan
          </h2>
          <p className="text-slate-500 mb-6">
            Toko yang Anda cari mungkin telah dihapus atau tidak tersedia.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-3xl shadow-sm shrink-0 border border-primary-100 overflow-hidden">
              {toko.logo ? (
                <img
                  src={toko.logo}
                  alt={toko.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                toko.name.substring(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mb-2">
                {toko.organisasiName}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                {toko.name}
              </h1>
              <p className="text-slate-600 max-w-2xl flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                Universitas Udayana
              </p>
            </div>

            <div className="flex gap-4 shrink-0 w-full md:w-auto">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 md:flex-none text-center md:text-left">
                <div className="text-sm text-slate-500 font-medium mb-1">
                  Total Proker
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {toko.subTokos.length}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 md:flex-none text-center md:text-left">
                <div className="text-sm text-slate-500 font-medium mb-1">
                  Total Produk
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {toko.allProducts.length}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Tentang Toko
            </h3>
            <p className="text-slate-600 leading-relaxed max-w-4xl">
              {toko.description}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-16">
        {/* Sub-Toko List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-primary-600" />
              Daftar Proker (Sub-Toko)
            </h2>
          </div>

          {toko.subTokos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
              Belum ada proker yang terdaftar pada toko ini.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toko.subTokos.map((st: any, i: number) => (
                <motion.div
                  key={st.id_sub_toko}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all group relative flex flex-col"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Store className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {st.nama_proker}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">
                    {st.deskripsi || "Tidak ada deskripsi"}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {st.produk?.length || 0} Produk
                    </span>
                    <Link
                      href={`/organizations/${toko.id}/${st.id_sub_toko}`}
                      className="text-primary-600 font-medium text-sm flex items-center hover:text-primary-700 transition-colors"
                    >
                      Kunjungi <ExternalLink className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-600" />
              Semua Produk
            </h2>
          </div>

          {toko.allProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
              Belum ada produk yang dijual dari proker manapun.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {toko.allProducts.map((product: any, i: number) => (
                <motion.div
                  key={product.id_produk}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    href={`/explore/${product.id_produk}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-300 transition-all">
                      <div className="aspect-square bg-slate-100 relative overflow-hidden">
                        {product.foto ? (
                          <img
                            src={product.foto}
                            alt={product.nama_produk}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm">
                          Stok: {product.stok}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-primary-600 font-semibold mb-1 truncate">
                          {product.subTokoName}
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                          {product.nama_produk}
                        </h3>
                        <p className="text-lg font-bold text-slate-900">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(product.harga)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function TokoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        </div>
      }
    >
      <TokoDetailContent />
    </Suspense>
  );
}
