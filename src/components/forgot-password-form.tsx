"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Email Terkirim!
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Kami telah mengirimkan instruksi reset password ke{" "}
          <span className="font-semibold text-slate-700">{email}</span>. Silakan
          cek kotak masuk Anda.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <Logo className="mb-8" />

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Lupa Password?
        </h1>
        <p className="text-slate-500">
          Masukkan email akun Anda dan kami akan mengirimkan tautan untuk
          mereset password.
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="email"
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          id="submit-forgot-password"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mengirim email...
            </>
          ) : (
            "Kirim"
          )}
        </button>

        {/* Back to login */}
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke halaman masuk
        </Link>
      </form>
    </div>
  );
}
