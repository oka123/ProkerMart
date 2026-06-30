/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft,
  Store,
  Package,
  Loader2,
  Calendar,
  MessageSquare,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

type SubTokoDetail = {
  id: string;
  name: string;
  description: string;
  fotoSampul: string | null;
  jadwalOperasional: string;
  tokoId: string;
  tokoName: string;
  products: any[];
};

function SubTokoDetailContent() {
  const params = useParams();
  const router = useRouter();
  const tokoId = params.tokoId as string;
  const subTokoId = params.subTokoId as string;

  const [subToko, setSubToko] = useState<SubTokoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubTokoDetail() {
      if (!tokoId || !subTokoId) return;

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      );

      try {
        const { data, error } = await supabase
          .from("sub_toko")
          .select(
            `
            id_sub_toko,
            nama_proker,
            deskripsi,
            foto_sampul,
            jadwal_operasional,
            id_toko,
            toko ( nama_toko ),
            produk (
              id_produk,
              nama_produk,
              harga,
              foto,
              kategori,
              stok,
              status_aktif,
              preorder,
              periode_open_end,
              estimasi_siap
            )
          `,
          )
          .eq("id_sub_toko", subTokoId)
          .eq("id_toko", tokoId)
          .single();

        if (error) throw error;
        if (!data) {
          router.push(`/organizations/${tokoId}`);
          return;
        }

        const tokoData = Array.isArray(data.toko) ? data.toko[0] : data.toko;

        setSubToko({
          id: data.id_sub_toko,
          name: data.nama_proker,
          description:
            data.deskripsi || "Belum ada deskripsi untuk proker ini.",
          fotoSampul: data.foto_sampul,
          jadwalOperasional: data.jadwal_operasional || "Setiap Hari",
          tokoId: data.id_toko,
          tokoName: tokoData ? tokoData.nama_toko : "Unknown",
          products: (data.produk || []).filter(
            (p: any) => p.status_aktif !== false,
          ),
        });
      } catch (error) {
        console.error("Error fetching sub_toko details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubTokoDetail();
  }, [tokoId, subTokoId, router]);

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

  if (!subToko) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
          <Store className="w-16 h-16 mb-4 text-slate-300" />
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            Proker Tidak Ditemukan
          </h2>
          <p className="mb-6 text-slate-500">
            Proker yang Anda cari mungkin telah dihapus atau tidak tersedia.
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
      <div className="bg-white border-b border-slate-200">
        {/* Cover Photo */}
        <div className="relative w-full h-48 overflow-hidden md:h-64 bg-slate-200">
          {subToko.fotoSampul ? (
            <Image
              src={subToko.fotoSampul}
              alt={subToko.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-linear-to-r from-blue-500 to-gray-400 opacity-80">
              <Store className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
        </div>

        <div className="relative px-4 pb-8 mx-auto -mt-12 max-w-7xl sm:px-6 lg:px-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center mb-6 text-sm font-medium text-white/90 hover:text-white drop-shadow-md"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </button>

          <div className="flex flex-col gap-8 p-6 bg-white border shadow-xl rounded-2xl md:p-8 border-slate-100 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 mb-3 text-xs font-bold text-blue-600 rounded-full bg-blue-50">
                {subToko.tokoName}
              </div>
              <h1 className="mb-4 text-3xl font-extrabold md:text-4xl text-slate-900">
                {subToko.name}
              </h1>
              <p className="max-w-3xl mb-6 leading-relaxed text-slate-600">
                {subToko.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm md:gap-8">
                <div className="flex items-center px-4 py-2 border rounded-lg text-slate-700 bg-slate-50 border-slate-100">
                  <Package className="w-5 h-5 mr-2 text-blue-500" />
                  <span className="font-semibold">
                    {subToko.products.length}
                  </span>{" "}
                  &nbsp;Produk
                </div>

                <div className="flex items-center px-4 py-2 border rounded-lg text-slate-700 bg-slate-50 border-slate-100">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-500" />
                  <span className="font-semibold">
                    {subToko.jadwalOperasional}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Button */}
            <div className="flex-none self-start md:self-center">
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("openProkerChat", {
                      detail: {
                        id_sub_toko: subToko.id,
                        name: subToko.name,
                      },
                    }),
                  );
                }}
                className="flex items-center gap-2 px-6 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat Proker</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between pb-4 mb-8 border-b border-slate-200">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Package className="w-6 h-6 text-blue-600" />
              Katalog Produk
            </h2>
          </div>

          {subToko.products.length === 0 ? (
            <div className="flex flex-col items-center p-12 text-center bg-white border rounded-2xl border-slate-200">
              <Package className="w-16 h-16 mb-4 text-slate-200" />
              <h3 className="mb-1 text-lg font-bold text-slate-900">
                Belum Ada Produk
              </h3>
              <p className="text-slate-500">
                Proker ini belum menambahkan produk apapun untuk dijual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 md:gap-6">
              {subToko.products.map((product: any, i: number) => (
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
                    <div className="flex flex-col h-full overflow-hidden transition-all bg-white border shadow-sm rounded-2xl border-slate-200 hover:shadow-xl hover:border-blue-300">
                      <div className="relative overflow-hidden aspect-square bg-slate-100 shrink-0">
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
                        {product.preorder ? (
                          <div className="absolute top-2 right-2 bg-violet-600/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> PO
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm">
                            Stok: {product.stok}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 p-4">
                        <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1">
                          {product.kategori || "Umum"}
                        </div>
                        <h3 className="flex-1 mb-2 text-sm font-medium leading-tight transition-colors text-slate-900 line-clamp-2 group-hover:text-blue-600">
                          {product.nama_produk}
                        </h3>
                        <p className="mt-auto text-lg font-bold text-slate-900">
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

export default function SubTokoDetailPage() {
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
      <SubTokoDetailContent />
    </Suspense>
  );
}
