"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, MapPin, Store, Package, Loader2, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
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
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      try {
        const { data, error } = await supabase
          .from("sub_toko")
          .select(`
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
              status_aktif
            )
          `)
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
          description: data.deskripsi || "Belum ada deskripsi untuk proker ini.",
          fotoSampul: data.foto_sampul,
          jadwalOperasional: data.jadwal_operasional || "Setiap Hari",
          tokoId: data.id_toko,
          tokoName: tokoData ? tokoData.nama_toko : "Unknown",
          products: (data.produk || []).filter((p: any) => p.status_aktif !== false)
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </div>
    );
  }

  if (!subToko) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Store className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Proker Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-6">Proker yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
          <Link href={`/organizations/${tokoId}`} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Kembali ke Toko
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full bg-slate-200 relative overflow-hidden">
          {subToko.fotoSampul ? (
            <img src={subToko.fotoSampul} alt={subToko.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center opacity-80">
              <Store className="w-20 h-20 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative pb-8">
          <Link href={`/organizations/${tokoId}`} className="inline-flex items-center text-sm font-medium text-white/90 hover:text-white mb-6 drop-shadow-md">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Toko
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-100 flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-3">
                {subToko.tokoName}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                {subToko.name}
              </h1>
              <p className="text-slate-600 leading-relaxed max-w-3xl mb-6">
                {subToko.description}
              </p>

              <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
                <div className="flex items-center text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <Package className="w-5 h-5 text-indigo-500 mr-2" />
                  <span className="font-semibold">{subToko.products.length}</span> &nbsp;Produk
                </div>

                <div className="flex items-center text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <Calendar className="w-5 h-5 text-emerald-500 mr-2" />
                  <span className="font-semibold">{subToko.jadwalOperasional}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              Katalog Produk
            </h2>
          </div>

          {subToko.products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center">
              <Package className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Produk</h3>
              <p className="text-slate-500">Proker ini belum menambahkan produk apapun untuk dijual.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {subToko.products.map((product: any, i: number) => (
                <motion.div
                  key={product.id_produk}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link href={`/explore/${product.id_produk}`} className="block group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col h-full">
                      <div className="aspect-square bg-slate-100 relative overflow-hidden shrink-0">
                        {product.foto ? (
                          <img src={product.foto} alt={product.nama_produk} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm">
                          Stok: {product.stok}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold mb-1">
                          {product.kategori || "Umum"}
                        </div>
                        <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors flex-1">
                          {product.nama_produk}
                        </h3>
                        <p className="text-lg font-bold text-slate-900 mt-auto">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0
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
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      </div>
    }>
      <SubTokoDetailContent />
    </Suspense>
  );
}
