import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getProductById } from "@/lib/supabase/queries/product";
import { getReviewsBySubToko } from "@/lib/supabase/queries/review";
import { ReviewList } from "./ReviewList";

interface ReviewsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReviewsPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Ulasan Tidak Ditemukan | ProkerMart" };
  return {
    title: `Ulasan ${product.nama_produk} | ProkerMart`,
    description: `Semua ulasan untuk ${product.nama_produk} di ProkerMart.`,
  };
}

async function ReviewsData({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const reviews = await getReviewsBySubToko(product.sub_toko.id_sub_toko);

  return (
    <div className="max-w-4xl px-4 py-6 mx-auto md:px-8 md:py-10">
      {/* Back Button */}
      <Link
        href={`/explore/${id}`}
        className="inline-flex items-center gap-2 mb-6 text-sm transition-colors text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Produk
      </Link>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm text-slate-500">
        <Link href="/explore" className="transition hover:text-blue-600">
          Eksplor
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/explore/${id}`}
          className="truncate transition hover:text-blue-600 max-w-40"
        >
          {product.nama_produk}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium text-slate-800">Semua Ulasan</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-snug md:text-3xl text-slate-900">
          Ulasan Pembeli
        </h1>
        <p className="mt-2 text-slate-500">
          Menampilkan ulasan untuk <strong>{product.nama_produk}</strong> dari
          sub-toko <strong>{product.sub_toko.nama_proker}</strong>.
        </p>
      </div>

      <ReviewList initialReviews={reviews} />
    </div>
  );
}

export default function ReviewsPage({ params }: ReviewsPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex justify-center max-w-4xl px-4 py-20 mx-auto">
            <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        }
      >
        <Navbar />
        <ReviewsData params={params} />
      </Suspense>
    </div>
  );
}
