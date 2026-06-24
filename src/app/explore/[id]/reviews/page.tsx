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
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-10">
      {/* Back Button */}
      <Link
        href={`/explore/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Produk
      </Link>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/explore" className="hover:text-blue-600 transition">
          Eksplor
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/explore/${id}`}
          className="hover:text-blue-600 transition truncate max-w-40"
        >
          {product.nama_produk}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-800 font-medium">Semua Ulasan</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug">
          Ulasan Pembeli
        </h1>
        <p className="text-slate-500 mt-2">
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
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
      >
        <ReviewsData params={params} />
      </Suspense>
    </div>
  );
}
