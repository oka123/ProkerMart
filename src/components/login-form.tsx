"use client";

import { createClient } from "@/lib/supabase/client";
import { fetchUserAccess } from "@/lib/auth-access";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

/** Inner component that reads searchParams — must be inside <Suspense> */
function LoginFormInner({ redirectTo }: { redirectTo?: string }) {
  const searchParams = useSearchParams();
  const redirect = redirectTo ?? searchParams.get("redirect");
  const destination = redirect ? decodeURIComponent(redirect) : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user =
        userData.user ??
        sessionData?.session?.user ??
        data.user ??
        data.session?.user;

      if (!user) {
        throw new Error("Gagal membaca informasi pengguna setelah login.");
      }

      if (destination) {
        router.push(destination);
        return;
      }

      const access = await fetchUserAccess(supabase, user.email!);

      if (process.env.NODE_ENV === "development") {
        console.debug("[Login] access:", access);
      }

      let targetRoute = "/explore";
      if (access?.hasProker && !access?.hasOrganisasi) {
        targetRoute = "/dashboard";
      } else if (access?.needsSelection) {
        targetRoute = "/auth/select-role";
      }
      
      router.push(targetRoute);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Email atau password salah.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Logo className="mb-8" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Selamat Datang
        </h1>
        <p className="text-slate-500">
          Masuk ke akun ProkerMart Anda untuk melanjutkan.
        </p>
      </div>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Masukkan password Anda"
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
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <button
          type="submit"
          id="submit-login"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Masuk...
            </>
          ) : (
            "Masuk"
          )}
        </button>
        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Daftar sekarang
          </Link>
        </p>
        {/* <p className="text-center text-sm text-slate-500">
          <Link
            href="/login-bypass"
            className="text-transparent font-semibold "
          >
            Login Bypass
          </Link>
        </p> */}
      </form>
    </div>
  );
}

/** Public export: wraps inner component in Suspense so useSearchParams works in static pages */
export function LoginForm({ redirectTo }: { redirectTo?: string } = {}) {
  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse h-96 bg-slate-100 rounded-xl" />
      }
    >
      <LoginFormInner redirectTo={redirectTo} />
    </Suspense>
  );
}
