"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Building2, AlertCircle, Loader2, Link as LinkIcon, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { org, refreshOrg } = useOrgDashboard();
  const [profile, setProfile] = useState({
    nama_organisasi: "",
    nomor_sk: "",
    email: "", // User's login email (readonly)
    logo: "",
    deskripsi: "",
    email_resmi: "",
    no_telp: "",
    sosmed: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadFullProfile = async () => {
    if (!org?.id_organisasi) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("organisasi")
      .select("nama_organisasi, nomor_sk, logo, deskripsi, email_resmi, no_telp, sosmed")
      .eq("id_organisasi", org.id_organisasi)
      .single();

    if (data) {
      setProfile({
        nama_organisasi: data.nama_organisasi || "",
        nomor_sk: data.nomor_sk || "",
        email: org.email || "",
        logo: data.logo || "",
        deskripsi: data.deskripsi || "",
        email_resmi: data.email_resmi || "",
        no_telp: data.no_telp || "",
        sosmed: data.sosmed || "",
      });
      if (data.logo) {
        setLogoPreview(data.logo);
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null);
    }
  };

  useEffect(() => {
    loadFullProfile();
  }, [org]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org?.id_organisasi) return;

    setIsSaving(true);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      let finalLogoUrl = profile.logo;

      // Handle Logo Upload if a new file is selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${org.id_organisasi}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("logo_organisasi")
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("logo_organisasi")
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrl;
      }

      const { error } = await supabase
        .from("organisasi")
        .update({
          nama_organisasi: profile.nama_organisasi,
          nomor_sk: profile.nomor_sk || null,
          logo: finalLogoUrl || null,
          deskripsi: profile.deskripsi || null,
          email_resmi: profile.email_resmi || null,
          no_telp: profile.no_telp || null,
          sosmed: profile.sosmed || null,
        })
        .eq("id_organisasi", org.id_organisasi);

      if (error) throw error;

      // Refresh context so sidebar reflects the new name
      refreshOrg();

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("[OrgDashboard - Settings] Error:", err);
      setErrorMsg("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const verificationLabel =
    org.status_verifikasi === "verified"
      ? "Terverifikasi"
      : org.status_verifikasi === "pending"
        ? "Menunggu Verifikasi"
        : "Ditolak";

  const verificationBadgeColor =
    org.status_verifikasi === "verified"
      ? "bg-emerald-100 text-emerald-700"
      : org.status_verifikasi === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">
              Pengaturan Organisasi berhasil diperbarui!
            </span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl shadow-lg border border-red-200"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden bg-white shrink-0 relative">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Organisasi" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Pengaturan Organisasi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola identitas utama dan klasifikasi lembaga Anda di platform.
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${verificationBadgeColor}`}
          >
            {verificationLabel}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm leading-relaxed">
              <strong>Catatan:</strong> Perubahan nama organisasi akan
              mempengaruhi tampilan toko Anda di halaman publik ProkerMart.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">1. Informasi Dasar Organisasi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo / Avatar Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Logo / Avatar Organisasi
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setLogoPreview(profile.logo || null);
                              setLogoFile(null);
                            }}
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <UploadCloud className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Ukuran file maksimal 2MB");
                            return;
                          }
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" /> Pilih Foto
                    </label>
                    <p className="text-xs text-slate-500">
                      Format disarankan: JPG, PNG, atau WebP. Maksimal 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nama Organisasi */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nama Organisasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.nama_organisasi}
                  onChange={(e) =>
                    setProfile({ ...profile, nama_organisasi: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Contoh: BEM FMIPA Universitas X"
                />
              </div>

              {/* Nomor SK */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nomor SK
                </label>
                <input
                  type="text"
                  value={profile.nomor_sk}
                  onChange={(e) =>
                    setProfile({ ...profile, nomor_sk: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Contoh: SK/BEM/2026/001"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Deskripsi / Bio
                </label>
                <textarea
                  value={profile.deskripsi}
                  onChange={(e) => setProfile({ ...profile, deskripsi: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white resize-none"
                  placeholder="Jelaskan secara singkat visi-misi atau deskripsi organisasi..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">2. Informasi Kontak</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Resmi */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={profile.email_resmi}
                  onChange={(e) => setProfile({ ...profile, email_resmi: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Contoh: humas@bem.univ.ac.id"
                />
              </div>

              {/* No Telp */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nomor Telepon (WhatsApp)
                </label>
                <input
                  type="text"
                  value={profile.no_telp}
                  onChange={(e) => setProfile({ ...profile, no_telp: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              {/* Media Sosial */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Media Sosial (Link Instagram/Website)
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={profile.sosmed}
                    onChange={(e) => setProfile({ ...profile, sosmed: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white"
                    placeholder="https://instagram.com/organisasi_anda"
                  />
                </div>
              </div>

              {/* Email Login (Read Only) */}
              <div className="space-y-2 md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700">
                  Email Terdaftar (Akun Login)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">
                  Email ini digunakan untuk login dan tidak dapat diubah langsung.
                  Hubungi admin untuk mengganti.
                </p>
              </div>

              {/* Status Verifikasi (Read Only) */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Status Verifikasi
                </label>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center text-sm font-semibold px-4 py-2 rounded-xl ${verificationBadgeColor}`}
                  >
                    {verificationLabel}
                  </span>
                  {org.status_verifikasi === "pending" && (
                    <p className="text-xs text-slate-500">
                      Menunggu verifikasi oleh admin. Proses biasanya memakan waktu
                      1-3 hari kerja.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 mt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                loadFullProfile();
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}