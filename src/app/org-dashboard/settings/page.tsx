"use client";

import { useState } from "react";
import { Save, CheckCircle2, Building2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ORG_TYPES = [
  { id: "BEM", label: "BEM (Badan Eksekutif Mahasiswa)" },
  { id: "HIMA", label: "HIMA (Himpunan Mahasiswa)" },
  { id: "DPM", label: "DPM (Dewan Perwakilan Mahasiswa)" },
  { id: "UKM", label: "UKM (Unit Kegiatan Mahasiswa)" },
  { id: "BSO", label: "BSO (Badan Semi Otonom)" }
];

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "FMIPA Universitas",
    type: "BEM",
    email: "bem.fmipa@universitas.ac.id" // Simulasi data tambahan
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    
    // Hilangkan notifikasi sukses setelah 3 detik
    setTimeout(() => setIsSaved(false), 3000); 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Toast Notification (Muncul saat tombol simpan ditekan) */}
      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Profil Organisasi berhasil diperbarui!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <Building2 className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profil Organisasi</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola identitas utama dan klasifikasi lembaga Anda di platform.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-sm leading-relaxed">
              <strong>Catatan:</strong> Perubahan Jenis Organisasi (misal: BEM ke HIMA) akan mengubah bagaimana toko Anda ditampilkan kepada pembeli di halaman utama ProkerMart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Jenis Organisasi */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Jenis Organisasi <span className="text-red-500">*</span>
              </label>
              <select 
                value={profile.type}
                onChange={(e) => setProfile({...profile, type: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
              >
                {ORG_TYPES.map(org => (
                  <option key={org.id} value={org.id}>{org.label}</option>
                ))}
              </select>
            </div>

            {/* Input Nama Organisasi */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Fakultas / Institusi <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white" 
                placeholder="Contoh: FMIPA Universitas X"
              />
            </div>
            
            {/* Input Email (Read Only - Sebagai contoh) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Email Terdaftar
              </label>
              <input 
                type="email" 
                disabled
                value={profile.email}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" 
              />
              <p className="text-xs text-slate-500">Email ini digunakan untuk login dan tidak dapat diubah langsung. Hubungi admin untuk mengganti.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 mt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button"
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> 
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}