import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, MapPin, ChevronRight, Clock } from "lucide-react";
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

  const orgName =
    product.sub_toko?.toko?.organisasi?.nama_organisasi ?? "Organisasi";
  const prokerName = product.sub_toko?.nama_proker ?? "Proker";
  const tokoName = product.sub_toko?.toko?.nama_toko ?? "-";

  const sellerName = prokerName;
  const sellerType = "toko";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
      {/* Back Button */}
      {/* <Link
        href="/explore"
        className="fixed top-28 lg:top-20 left-4 md:left-8 z-40 w-12 h-12 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all"
        title="Kembali"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link> */}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/explore" className="hover:text-blue-600 transition">
          Eksplor
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/explore" className="hover:text-blue-600 transition">
          {product.kategori ?? "Produk"}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium truncate max-w-50">
          {product.nama_produk}
        </span>
      </nav>

      {/* Product Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left Column - Image */}
          <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-8 md:pt-12 flex items-start justify-center min-h-75 md:min-h-105">
            <div className="w-full max-w-70 aspect-square bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 overflow-hidden">
              {product.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.foto}
                  alt={product.nama_produk}
                  className="w-full h-full object-cover"
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
          <div className="p-6 md:p-8 flex flex-col">
            {/* Badge & Title */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {/* <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                  {orgName}
                </span> */}
                {/* <span className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {prokerName}
                </span> */}
                {product.preorder && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Preorder
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mt-1">
                {product.nama_produk}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-extrabold text-blue-600">
                  Rp {Number(product.harga).toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2 mb-2">
                Stok tersisa:{" "}
                <span className="font-semibold text-slate-700">
                  {product.stok} item
                </span>
              </p>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                📋 Deskripsi Produk
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-1">
                {product.deskripsi ?? "Tidak ada deskripsi."}
              </p>
              <div className="flex flex-wrap gap-2 text-xs mt-2">
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
                    <span className="font-semibold text-slate-800 capitalize">
                      {product.metode_jualan.replace(/,/g, " & ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Interactive Part — Client Component */}
            <ProductActions
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
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
      >
        <ProductData params={params} />
      </Suspense>
    </div>
  );
}
