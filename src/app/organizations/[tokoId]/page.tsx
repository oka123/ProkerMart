/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Image from "next/image";
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
            organisasi ( nama_organisasi, logo, deskripsi ),
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
          description: (org && org.deskripsi) ? org.deskripsi : (data.deskripsi || "Belum ada deskripsi"),
          logo: org ? org.logo : data.logo,
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
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!toko) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
          <Store className="w-16 h-16 mb-4 text-slate-300" />
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            Toko Tidak Ditemukan
          </h2>
          <p className="mb-6 text-slate-500">
            Toko yang Anda cari mungkin telah dihapus atau tidak tersedia.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 text-white rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
      <Navbar />

      {/* Hero Header */}
      <div className="pt-8 pb-12 bg-white border-b border-slate-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center mb-6 text-sm font-medium transition-colors text-slate-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </button>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="relative flex items-center justify-center w-24 h-24 overflow-hidden text-3xl font-bold border shadow-sm rounded-2xl bg-primary-50 text-primary-600 shrink-0 border-primary-100">
              {toko.logo ? (
                <Image
                  src={toko.logo}
                  alt={toko.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                toko.name.substring(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <div className="inline-block px-3 py-1 mb-2 text-xs font-bold text-blue-600 rounded-full bg-blue-50">
                {toko.organisasiName}
              </div>
              <h1 className="mb-2 text-3xl font-extrabold md:text-4xl text-slate-900">
                {toko.name}
              </h1>
              <p className="flex items-start max-w-2xl gap-1 text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                Universitas Udayana
              </p>
            </div>

            <div className="flex w-full gap-4 shrink-0 md:w-auto">
              <div className="flex-1 p-4 text-center border bg-slate-50 rounded-xl border-slate-100 md:flex-none md:text-left">
                <div className="mb-1 text-sm font-medium text-slate-500">
                  Total Proker
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {toko.subTokos.length}
                </div>
              </div>
              <div className="flex-1 p-4 text-center border bg-slate-50 rounded-xl border-slate-100 md:flex-none md:text-left">
                <div className="mb-1 text-sm font-medium text-slate-500">
                  Total Produk
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {toko.allProducts.length}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Tentang Toko
            </h3>
            <p className="max-w-4xl leading-relaxed text-slate-600">
              {toko.description}
            </p>
          </div>
        </div>
      </div>

      <main className="w-full px-4 py-12 mx-auto space-y-16 max-w-7xl sm:px-6 lg:px-8">
        {/* Sub-Toko List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Store className="w-6 h-6 text-primary-600" />
              Daftar Proker (Sub-Toko)
            </h2>
          </div>

          {toko.subTokos.length === 0 ? (
            <div className="p-8 text-center bg-white border rounded-2xl border-slate-200 text-slate-500">
              Belum ada proker yang terdaftar pada toko ini.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {toko.subTokos.map((st: any, i: number) => (
                <motion.div
                  key={st.id_sub_toko}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative flex flex-col p-6 transition-all bg-white border rounded-2xl border-slate-200 hover:border-primary-300 hover:shadow-lg group"
                >
                  <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 rounded-xl bg-blue-50">
                    <Store className="w-6 h-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">
                    {st.nama_proker}
                  </h3>
                  <p className="flex-1 mb-6 text-sm text-slate-500 line-clamp-2">
                    {st.deskripsi || "Tidak ada deskripsi"}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="px-3 py-1 text-sm font-medium rounded-full text-slate-600 bg-slate-100">
                      {st.produk?.length || 0} Produk
                    </span>
                    <Link
                      href={`/organizations/${toko.id}/${st.id_sub_toko}`}
                      className="flex items-center text-sm font-medium transition-colors text-primary-600 hover:text-primary-700"
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
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Package className="w-6 h-6 text-primary-600" />
              Semua Produk
            </h2>
          </div>

          {toko.allProducts.length === 0 ? (
            <div className="p-8 text-center bg-white border rounded-2xl border-slate-200 text-slate-500">
              Belum ada produk yang dijual dari proker manapun.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
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
                    <div className="overflow-hidden transition-all bg-white border shadow-sm rounded-2xl border-slate-200 hover:shadow-xl hover:border-primary-300">
                      <div className="relative overflow-hidden aspect-square bg-slate-100">
                        {product.foto ? (
                          <Image
                            src={product.foto}
                            alt={product.nama_produk}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm">
                          Stok: {product.stok}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-1 text-xs font-semibold truncate text-primary-600">
                          {product.subTokoName}
                        </div>
                        <h3 className="mb-2 text-sm font-medium leading-tight transition-colors text-slate-900 line-clamp-2 group-hover:text-primary-600">
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
        <div className="flex flex-col min-h-screen bg-slate-50">
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        </div>
      }
    >
      <TokoDetailContent />
    </Suspense>
  );
}
