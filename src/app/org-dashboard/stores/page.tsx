"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Power,
} from "lucide-react";
import { useOrgDashboard } from "@/lib/context/OrgDashboardContext";
import { createClient } from "@/lib/supabase/client";

import { ProkerModal } from "@/components/org/proker-modal";

type SubToko = {
  id_sub_toko: string;
  nama_proker: string;
  deskripsi: string | null;
  status: string;
  tgl_dibuat: string;
  productCount: number;
};

export default function StoreManagementPage() {
  const { org } = useOrgDashboard();
  const [subTokos, setSubTokos] = useState<SubToko[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<SubToko>>({});
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSubTokos = useCallback(async () => {
    if (!org?.id_toko) { setLoading(false); return; }
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("sub_toko")
        .select("id_sub_toko, nama_proker, deskripsi, status, tgl_dibuat")
        .eq("id_toko", org.id_toko)
        .order("tgl_dibuat", { ascending: false });

      if (error) throw error;

      // Fetch product counts for each sub_toko
      const subTokosWithCount: SubToko[] = [];
      for (const st of data ?? []) {
        const { count } = await supabase
          .from("produk")
          .select("id_produk", { count: "exact", head: true })
          .eq("id_sub_toko", st.id_sub_toko);

        subTokosWithCount.push({
          ...st,
          productCount: count ?? 0,
        });
      }

      setSubTokos(subTokosWithCount);
    } catch (err) {
      console.error("[OrgDashboard - Stores] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [org?.id_toko]);

  useEffect(() => {
    fetchSubTokos();
  }, [fetchSubTokos]);

  const showSuccessToast = (message: string) => {
    setSuccessMessage(message);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const showErrorToast = (message: string) => {
    setErrorMessage(message);
    setIsError(true);
    setTimeout(() => setIsError(false), 5000);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentItem({
      nama_proker: "",
      deskripsi: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SubToko) => {
    setModalMode("edit");
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: SubToko) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  // Removed inline handleSave since ProkerModal handles it

  const handleDelete = async () => {
    if (!currentItem.id_sub_toko) return;
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("sub_toko")
        .delete()
        .eq("id_sub_toko", currentItem.id_sub_toko);

      if (error) throw error;

      setIsDeleteModalOpen(false);
      showSuccessToast("Proker berhasil dihapus!");
      await fetchSubTokos();
    } catch (err: unknown) {
      console.error("[OrgDashboard - Stores] Delete error:", err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      showErrorToast(`Gagal menghapus proker: ${msg}`);
    }
  };

  const handleToggleStatus = async (item: SubToko) => {
    const supabase = createClient();
    const newStatus = item.status === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase
        .from("sub_toko")
        .update({ status: newStatus })
        .eq("id_sub_toko", item.id_sub_toko);

      if (error) throw error;
      showSuccessToast(`Proker berhasil di${newStatus === "active" ? "aktifkan" : "nonaktifkan"}.`);
      await fetchSubTokos();
    } catch (err: unknown) {
      console.error("Toggle status error:", err);
      showErrorToast("Gagal mengubah status proker.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "Aktif", color: "bg-emerald-100 text-emerald-700" };
      case "inactive":
        return { label: "Nonaktif", color: "bg-slate-100 text-slate-600" };
      case "suspended":
        return { label: "Ditangguhkan", color: "bg-amber-100 text-amber-700" };
      default:
        return { label: status, color: "bg-slate-100 text-slate-600" };
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Toast Notifications */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl shadow-lg border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </motion.div>
        )}
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl shadow-lg border border-red-200 max-w-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Sub-Toko (Proker)
          </h1>
          <p className="text-sm text-slate-500">
            Kelola informasi dan status sub-toko (proker)
            Anda.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Daftarkan Proker Baru
        </button>
      </div>

      {/* Proker Grid */}
      {subTokos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Belum ada proker terdaftar
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Mulai dengan mendaftarkan program kerja pertama organisasi Anda
          </p>
          <button
            onClick={openAddModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Daftarkan Proker Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subTokos.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <motion.div
                key={item.id_sub_toko}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                        {item.nama_proker}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                        {item.id_sub_toko.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg text-left"
                      >
                        <Power className="w-4 h-4" /> {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {item.deskripsi || "Tidak ada deskripsi"}
                  </p>

                  <div className="flex justify-between items-center mt-auto">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {item.productCount} Produk
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <ProkerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={
          currentItem
            ? {
              ...currentItem,
            }
            : undefined
        }
        orgId={org?.id_organisasi || ""}
        tokoId={org?.id_toko || ""}
        penggunaId={org?.id_pengguna || ""}
        onSuccess={(msg) => {
          showSuccessToast(msg);
          fetchSubTokos();
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Hapus Proker?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Apakah Anda yakin ingin menghapus{" "}
                <strong>{currentItem.nama_proker}</strong>? Semua produk dan
                data pesanan yang terkait tidak dapat dikembalikan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}