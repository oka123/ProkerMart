import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md p-8 text-center bg-white border shadow-sm rounded-2xl border-slate-100">
        {/* Animated checkmark icon */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-100">
            <MailCheck className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-slate-900">
          Cek Email Anda!
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          Akun Anda berhasil dibuat. Kami telah mengirimkan tautan konfirmasi ke
          email Anda. Klik tautan tersebut untuk mengaktifkan akun sebelum
          masuk.
        </p>

        {/* Tips */}
        <div className="p-4 mb-8 text-left border bg-slate-50 border-slate-200 rounded-xl">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Tips jika email tidak ditemukan:
          </p>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>
              • Cek folder <span className="font-medium">Spam / Junk</span>{" "}
              email Anda
            </li>
            <li>• Pastikan alamat email yang didaftarkan sudah benar</li>
            <li>
              • Tunggu beberapa menit, pengiriman mungkin sedikit terlambat
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <button className="w-full px-4 py-3 font-semibold text-white transition-colors bg-primary-600 hover:bg-primary-700 rounded-xl">
              Masuk ke Akun
            </button>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors text-slate-500 hover:text-slate-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
