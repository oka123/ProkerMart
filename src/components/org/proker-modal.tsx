import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  X,
  CheckCircle2,
  Calendar,
  AlignLeft,
  Loader2,
  AlertCircle,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Seminar & Talkshow",
  "Kompetisi / Lomba",
  "Pentas Seni / Konser",
  "Bakti Sosial / Pengabdian",
  "Pelatihan / Workshop",
  "Lainnya"
];

export type ProkerFormData = {
  id_sub_toko?: string;
  nama_proker: string;
  deskripsi: string | null;
  status: string;
};

interface ProkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  mode: "add" | "edit";
  initialData?: Partial<ProkerFormData>;
  orgId: string;
  tokoId: string;
  penggunaId: string;
}

export function ProkerModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
  orgId,
  tokoId,
  penggunaId,
}: ProkerModalProps) {
  const [formData, setFormData] = useState<ProkerFormData>({
    nama_proker: "",
    deskripsi: "",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          id_sub_toko: initialData.id_sub_toko,
          nama_proker: initialData.nama_proker || "",
          deskripsi: initialData.deskripsi || "",
          status: initialData.status || "active",
        });
      } else {
        setFormData({
          nama_proker: "",
          deskripsi: "",
          status: "active",
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokoId) {
      setErrorMsg("Toko Induk organisasi Anda belum terdaftar atau belum diverifikasi. Tidak dapat membuat proker.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const supabase = createClient();

    try {
      if (mode === "add") {
        const { error } = await supabase.from("sub_toko").insert({
          id_toko: tokoId,
          id_pengguna: penggunaId,
          nama_proker: formData.nama_proker,
          deskripsi: formData.deskripsi || null,
          status: formData.status,
        });
        if (error) throw error;
        onSuccess("Proker baru berhasil didaftarkan!");
      } else {
        const { error } = await supabase
          .from("sub_toko")
          .update({
            nama_proker: formData.nama_proker,
            deskripsi: formData.deskripsi || null,
            status: formData.status,
          })
          .eq("id_sub_toko", formData.id_sub_toko!);
        if (error) throw error;
        onSuccess("Data proker berhasil diperbarui!");
      }
      onClose();
    } catch (err: any) {
      console.error("[ProkerModal] Error:", err);
      
      let errorMessage = "Terjadi kesalahan saat menyimpan data.";
      if (err?.code === "23505" && err?.message?.includes("sub_toko_id_pengguna_key")) {
        errorMessage = "Anda sudah terdaftar sebagai pengelola di proker lain. Satu akun hanya dapat mengelola satu proker utama.";
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mode === "add" ? "Daftarkan Proker Baru" : "Edit Data Proker"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "add"
                  ? "Buat sub-toko untuk proker baru"
                  : "Perbarui informasi sub-toko"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-6 space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div className="text-sm font-semibold">{errorMsg}</div>
              </div>
            )}

            {mode === "add" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                <div className="text-sm leading-relaxed">
                  <strong>Info:</strong> Proker yang didaftarkan akan otomatis
                  membuat sub-toko. Anda dapat menugaskan panitia di menu
                  Manajemen Anggota nanti.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nama Program Kerja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_proker}
                  onChange={(e) => setFormData({ ...formData, nama_proker: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  placeholder="Contoh: Dies Natalis Fakultas ke-30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Status Operasional
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white cursor-pointer"
                >
                  <option value="active">Aktif</option>
                  <option value="suspended">Ditangguhkan</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Deskripsi Singkat
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="h-4 w-4 text-slate-400" />
                  </div>
                  <textarea
                    rows={3}
                    value={formData.deskripsi || ""}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50 focus:bg-white resize-y"
                    placeholder="Ceritakan secara singkat mengenai tujuan program kerja ini..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onClose()}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:bg-primary-400 min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "add" ? (
                    <Target className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {mode === "add" ? "Daftarkan" : "Simpan"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
