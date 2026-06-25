import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  const errorMessage = params?.error
    ? decodeURIComponent(params.error)
    : "Terjadi kesalahan yang tidak diketahui.";

  return (
    <p className="text-sm leading-relaxed text-slate-500">{errorMessage}</p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 text-center bg-white border shadow-sm rounded-2xl border-slate-100">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-slate-900">
          Oops, Ada Kesalahan!
        </h1>

        {/* Error description */}
        <div className="px-2 mb-6">
          <Suspense
            fallback={
              <p className="text-sm text-slate-400">Memuat detail...</p>
            }
          >
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <button className="w-full px-4 py-3 font-semibold text-white transition-colors bg-primary-600 hover:bg-primary-700 rounded-xl">
              Coba Masuk Kembali
            </button>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
