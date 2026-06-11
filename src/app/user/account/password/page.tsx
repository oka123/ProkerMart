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
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
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

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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

      // Step 1: Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error("Password saat ini salah.");
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Also update password field in `pengguna` table
      // (Optional but good since we maintain a manual sync of password in initial_schema)
      await supabase
        .from("pengguna")
        .update({ password: formData.newPassword }) // Just for mock/sync purpose based on ERD
        .eq("email", userEmail);

      setStatus("success");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Gagal mengubah password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <MobileHeader
              title="Ubah Password"
              backHref="/user/account/profile"
              rightActions={[]}
            />

            <div className="bg-white lg:rounded-sm lg:shadow-sm min-h-125">
              <div className="hidden lg:block p-6 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-900">
                  Ubah Password
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Untuk keamanan akun Anda, mohon tidak menyebarkan password
                  Anda ke orang lain.
                </p>
              </div>

              <div className="p-6 lg:p-12 ">
                <AnimatePresence mode="wait">
                  {status === "success" ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        Password Berhasil Diubah
                      </h3>
                      <p className="text-slate-500">
                        Keamanan akun Anda telah diperbarui. Silakan gunakan
                        password baru Anda untuk login berikutnya.
                      </p>
                      <button
                        onClick={() => setStatus("idle")}
                        className="mt-4 px-8 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-all font-medium"
                      >
                        Kembali
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleSubmit}
                      className="space-y-6 max-w-xl"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-400" />
                          Password Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            required
                            type={showPasswords.current ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                currentPassword: e.target.value,
                              })
                            }
                            placeholder="Masukkan password saat ini"
                            className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisibility("current")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          Password Baru
                        </label>
                        <div className="relative">
                          <input
                            required
                            type={showPasswords.new ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Minimal 8 karakter"
                            className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisibility("new")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Gunakan kombinasi huruf, angka, dan simbol untuk
                          password yang lebih kuat.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-slate-400" />
                          Konfirmasi Password Baru
                        </label>
                        <div className="relative">
                          <input
                            required
                            type={showPasswords.confirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Ulangi password baru"
                            className="w-full border border-slate-200 rounded-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisibility("confirm")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {status === "error" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-100 p-3 rounded-sm flex items-center gap-2 text-red-600 text-sm"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </motion.div>
                      )}

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={status === "loading"}
                          className={`w-full lg:w-auto px-12 py-3 bg-primary-600 text-white font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all flex items-center justify-center gap-2 ${
                            status === "loading"
                              ? "opacity-70 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {status === "loading" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Memproses...</span>
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
          </div>
        </div>
      </main>
    </div>
  );
}
