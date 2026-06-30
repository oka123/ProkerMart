"use client";

import { useState } from "react";
import { 
  Store, 
  Calendar, 
  Target, 
  AlignLeft, 
  UploadCloud, 
  CheckCircle2, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  "Seminar & Talkshow",
  "Kompetisi / Lomba",
  "Pentas Seni / Konser",
  "Bakti Sosial / Pengabdian",
  "Pelatihan / Workshop",
  "Lainnya"
];

export default function NewProkerPage() {
  const [formData, setFormData] = useState({
    name: "",
    category: "Seminar & Talkshow",
    startDate: "",
    endDate: "",
    targetRevenue: "",
    description: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulasi request ke backend selama 1.5 detik
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Menghilangkan pesan sukses setelah 3 detik
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Reset form (opsional, tergantung alur bisnis Anda)
      setFormData({
        name: "",
        category: "Seminar & Talkshow",
        startDate: "",
        endDate: "",
        targetRevenue: "",
        description: ""
      });
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Proker baru berhasil didaftarkan!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100">
            <Store className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daftarkan Proker Baru</h1>
            <p className="text-sm text-slate-500 mt-1">Buat sub-toko baru untuk program kerja atau kepanitiaan Anda.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="text-sm leading-relaxed">
              <strong>Info Registrasi:</strong> Proker yang didaftarkan akan otomatis membuat <span className="font-semibold">Sub-Toko</span> baru di bawah naungan organisasi Anda. Anda dapat mendelegasikan anggota sebagai pengurus di menu Manajemen Anggota.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input Nama Proker */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nama Program Kerja <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white placeholder-slate-400" 
                placeholder="Contoh: Dies Natalis Fakultas ke-30"
              />
            </div>

            {/* Input Kategori */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Kategori Kegiatan <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all cursor-pointer bg-slate-50 hover:bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Input Target Revenue */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Target Omzet / Pendanaan (Rp)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-sm font-medium">Rp</span>
                </div>
                <input 
                  type="number"
                  min="0"
                  value={formData.targetRevenue}
                  onChange={(e) => setFormData({...formData, targetRevenue: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white placeholder-slate-400" 
                  placeholder="Contoh: 15000000"
                />
              </div>
            </div>

            {/* Input Periode Mulai */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="date" 
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white cursor-text" 
                />
              </div>
            </div>

            {/* Input Periode Selesai */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="date" 
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white cursor-text" 
                />
              </div>
            </div>

            {/* Input Deskripsi */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Deskripsi Singkat <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft className="h-4 w-4 text-slate-400" />
                </div>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-slate-50 hover:bg-white focus:bg-white placeholder-slate-400 resize-y" 
                  placeholder="Ceritakan secara singkat mengenai tujuan program kerja ini..."
                />
              </div>
            </div>
            
            {/* Input Logo / Cover (Mock) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Logo / Cover Proker (Opsional)
              </label>
              <div className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-primary-500 mb-2 transition-colors" />
                <p className="text-sm font-medium text-slate-600">Klik atau seret file gambar ke sini</p>
                <p className="text-xs text-slate-400 mt-1">Maks. ukuran file 2MB (JPG, PNG)</p>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-8 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link 
              href="/org-dashboard"
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" /> 
                  Daftarkan Proker
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}