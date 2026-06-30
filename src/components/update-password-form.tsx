"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo */}
      <Logo className="mb-8" />

      {/* Icon + Heading */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Buat Password Baru</h1>
        <p className="text-slate-500">Pastikan password baru Anda kuat dan mudah diingat.</p>
      </div>

      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password Baru
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
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              required
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
          id="submit-update-password"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Password Baru"
          )}
        </button>
      </form>
    </div>
  );
}
