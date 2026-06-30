/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserEmail(user.email || "");
    }
    init();
  }, [router, supabase]);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("Konfirmasi password baru tidak cocok.");
      }
      if (formData.newPassword.length < 8) {
        throw new Error("Password baru harus minimal 8 karakter.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error("Password saat ini salah.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) throw updateError;

      await supabase
        .from("pengguna")
        .update({ password: formData.newPassword })
        .eq("email", userEmail);

      setStatus("success");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("[DashboardPassword - handleSubmit] Error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Gagal mengubah password.");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/akun" className="text-sm text-primary-600 hover:underline">
          ← Kembali ke Akun Saya
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Ubah Password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Untuk keamanan akun, jangan bagikan password kepada siapapun.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 space-y-4 text-center"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-50">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Password Berhasil Diubah</h3>
              <p className="text-sm text-slate-500">
                Keamanan akun Anda telah diperbarui. Gunakan password baru untuk login berikutnya.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="px-8 py-2 mt-4 font-medium text-white transition-all rounded-lg bg-primary-600 hover:bg-primary-700"
              >
                Kembali
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Password Saat Ini
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Masukkan password saat ini"
                    className="w-full px-4 py-3 pr-12 text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("current")}
                    className="absolute -translate-y-1/2 right-4 top-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-3 pr-12 text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("new")}
                    className="absolute -translate-y-1/2 right-4 top-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ulangi password baru"
                    className="w-full px-4 py-3 pr-12 text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("confirm")}
                    className="absolute -translate-y-1/2 right-4 top-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 text-sm text-red-600 border border-red-100 rounded-lg bg-red-50"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Konfirmasi"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
