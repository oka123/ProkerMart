"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { User, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

type Role = "pembeli" | "organisasi";

function SignUpFormInner() {
  const searchParams = useSearchParams();
  const redirectAfter = searchParams.get("redirect") ?? null;
  const inviteEmail = searchParams.get("email") ?? "";
  
  const [role, setRole] = useState<Role>("pembeli");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const confirmBase = `${window.location.origin}/auth/confirm`;
      const emailRedirectTo = redirectAfter
        ? `${confirmBase}?next=${encodeURIComponent(redirectAfter)}`
        : confirmBase;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo */}
      <Logo className="mb-8" />

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Buat Akun Baru
        </h1>
        <p className="text-slate-500">
          Bergabung dan mulai berjualan atau berbelanja di ProkerMart.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          type="button"
          id="role-pembeli"
          onClick={() => setRole("pembeli")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
            role === "pembeli"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <User
            className={`w-6 h-6 ${role === "pembeli" ? "text-primary-600" : "text-slate-400"}`}
          />
          <div className="text-center">
            <p
              className={`text-sm font-semibold ${role === "pembeli" ? "text-primary-700" : "text-slate-700"}`}
            >
              Pembeli
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Saya ingin berbelanja
            </p>
          </div>
        </button>

        <button
          type="button"
          id="role-organisasi"
          onClick={() => setRole("organisasi")}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
            role === "organisasi"
              ? "border-primary-500 bg-primary-50 text-primary-700"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
          }`}
        >
          <Building2
            className={`w-6 h-6 ${role === "organisasi" ? "text-primary-600" : "text-slate-400"}`}
          />
          <div className="text-center">
            <p
              className={`text-sm font-semibold ${role === "organisasi" ? "text-primary-700" : "text-slate-700"}`}
            >
              Organisasi
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Kami ingin berjualan
            </p>
          </div>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        {/* Name Field */}
        <div>
          <label
            htmlFor="full-name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {role === "organisasi" ? "Nama Organisasi" : "Nama Lengkap"}
          </label>
          <input
            id="full-name"
            type="text"
            required
            placeholder={
              role === "organisasi"
                ? "cth. Himpunan Mahasiswa Teknik"
                : "cth. Budi Santoso"
            }
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            readOnly={!!inviteEmail}
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${inviteEmail ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
          />
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Min. 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              required
              placeholder="Ulangi password Anda"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
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
          id="submit-signup"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Membuat akun...
            </>
          ) : (
            "Buat Akun"
          )}
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Masuk di sini
          </Link>
        </p>
      </form>
    </div>
  );
}

export function SignUpForm() {
  return (
    <Suspense fallback={<div className="w-full animate-pulse h-96 bg-slate-100 rounded-xl" />}>
      <SignUpFormInner />
    </Suspense>
  );
}
