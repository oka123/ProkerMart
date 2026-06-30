import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ChevronRight, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProductActions } from "@/components/explore/ProductActions";
import { ProductReviews } from "@/components/explore/ProductReviews";
import { SellerCard } from "@/components/explore/SellerCard";
import { getProductById } from "@/lib/supabase/queries/product";
import { getReviewsBySubToko } from "@/lib/supabase/queries/review";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Produk Tidak Ditemukan | ProkerMart" };
  return {
    title: `${product.nama_produk} | ProkerMart`,
    description:
      product.deskripsi ?? `Beli ${product.nama_produk} di ProkerMart.`,
  };
}

async function ProductData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const reviews = await getReviewsBySubToko(product.sub_toko.id_sub_toko);

  // const orgName =
  //   product.sub_toko?.toko?.organisasi?.nama_organisasi ?? "Organisasi";
  const prokerName = product.sub_toko?.nama_proker ?? "Proker";
  const tokoName = product.sub_toko?.toko?.nama_toko ?? "-";

  const sellerName = prokerName;
  const sellerType = "toko";

  return (
    <div className="max-w-5xl px-4 py-6 mx-auto md:px-8 md:py-10">
      {/* Back Button */}
      {/* <Link
        href="/explore"
        className="fixed z-40 flex items-center justify-center w-12 h-12 transition-all bg-white border rounded-full shadow-lg top-28 lg:top-20 left-4 md:left-8 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1"
        title="Kembali"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link> */}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/explore" className="transition hover:text-blue-600">
          Eksplor
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/explore" className="transition hover:text-blue-600">
          {product.kategori ?? "Produk"}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium truncate text-slate-800 max-w-50">
          {product.nama_produk}
        </span>
      </nav>

      {/* Product Card */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
          {/* Left Column - Image */}
          <div className="flex items-start justify-center p-8 border-b bg-slate-50 md:border-b-0 md:border-r border-slate-200 md:pt-12 min-h-75 md:min-h-105">
            <div className="relative flex flex-col items-center justify-center w-full gap-3 overflow-hidden bg-white border shadow-sm max-w-70 aspect-square rounded-xl border-slate-200">
              {product.foto ? (
                <Image
                  src={product.foto}
                  alt={product.nama_produk}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <>
                  <ShoppingBag className="w-20 h-20 text-slate-300" />
                  <p className="text-xs text-slate-400">
                    Belum ada gambar produk
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Info & Form */}
          <div className="flex flex-col p-6 md:p-8">
            {/* Badge & Title */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 rounded-full bg-blue-50">
                  {orgName}
                </span> */}
                {/* <span className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                  <MapPin className="w-3 h-3" /> {prokerName}
                </span> */}
                {product.preorder && (
                  <span className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">
                    <Clock className="w-3 h-3" /> Preorder
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-xl font-bold leading-snug md:text-2xl text-slate-900">
                {product.nama_produk}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-extrabold text-blue-600">
                  Rp {Number(product.harga).toLocaleString("id-ID")}
                </span>
              </div>
              {product.preorder ? (
                <div className="mt-2 mb-2 space-y-1">
                  {product.periode_open_start && product.periode_open_end && (
                    <p className="text-sm text-slate-500">
                      Periode PO:{" "}
                      <span className="font-semibold text-slate-700">
                        {new Date(product.periode_open_start).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {" – "}
                        {new Date(product.periode_open_end).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </p>
                  )}
                  {product.estimasi_siap && (
                    <p className="text-sm text-slate-500">
                      Estimasi siap:{" "}
                      <span className="font-semibold text-violet-700">
                        {new Date(product.estimasi_siap).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </p>
                  )}
                  {product.dp_persen > 0 && (
                    <p className="text-sm text-orange-600 font-semibold">
                      DP {product.dp_persen}% sekarang · Sisa bayar pas ambil
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 mb-2 text-sm text-slate-500">
                  Stok tersisa:{" "}
                  <span className="font-semibold text-slate-700">
                    {product.stok} item
                  </span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-bold text-slate-800">
                📋 Deskripsi Produk
              </h3>
              <p className="mb-1 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                {product.deskripsi ?? "Tidak ada deskripsi."}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {product.kategori && (
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                    <span className="text-slate-500">Kategori: </span>
                    <span className="font-semibold text-slate-800">
                      {product.kategori}
                    </span>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                  <span className="text-slate-500">Toko: </span>
                  <span className="font-semibold text-slate-800">
                    {tokoName}
                  </span>
                </div>
                {product.metode_jualan && (
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                    <span className="text-slate-500">Metode: </span>
                    <span className="font-semibold capitalize text-slate-800">
                      {product.metode_jualan.replace(/,/g, " & ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="mb-5 border-slate-100" />

            {/* Interactive Part — Client Component */}
            <ProductActions
              product={product}
              productId={product.id_produk}
              price={Number(product.harga)}
              stock={product.stok}
              productName={product.nama_produk}
              sellerName={sellerName}
              sellerType={sellerType}
              subTokoId={product.sub_toko.id_sub_toko}
            />
          </div>
        </div>
      </div>

      {/* Seller Information Card */}
      <SellerCard sellerInfo={product.sub_toko} />

      {/* Reviews Section */}
      <ProductReviews
        productId={product.id_produk}
        subTokoId={product.sub_toko.id_sub_toko}
        initialReviews={reviews}
      />
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center max-w-5xl px-4 py-20 mx-auto">
            <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        }
      >
        <Navbar />
        <ProductData params={params} />
      </Suspense>
    </div>
  );
}
