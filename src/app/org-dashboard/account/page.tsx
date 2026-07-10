"use client";

import { useEffect, useState, useRef } from "react";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "./actions";
import { UserCircle, Mail, Shield, CheckCircle2, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountPage() {
  const { org } = useOrgDashboard();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadUser() {
      if (!org?.id_pengguna) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pengguna")
        .select("nama, email, role")
        .eq("id_pengguna", org.id_pengguna)
        .single();
        
      if (data && !error) {
        setNama(data.nama);
        setEmail(data.email);
        setRole(data.role);
      }
      setLoading(false);
    }
    
    loadUser();
  }, [org?.id_pengguna]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setIsSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfile(formData);

    setSaving(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    pembeli: "Pembeli",
    organisasi: "Organisasi",
    proker: "Panitia Proker",
    admin: "Administrator"
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Profil berhasil diperbarui!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Akun Saya</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola informasi personal dan kredensial akun Anda.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-blue-800 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <UserCircle className="w-16 h-16" />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-16 pb-8 px-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400">
                  <UserCircle className="w-5 h-5" />
                </div>
                <input
                  name="nama"
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Alamat Email (Read-only)
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Hak Akses Utama (Role)
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400">
                  <Shield className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={roleLabels[role] || role}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none capitalize"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
