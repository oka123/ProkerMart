/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  CheckCircle2,
} from "lucide-react";

// Tipe data berdasarkan ERD Sub_toko
type Proker = {
  id: string;
  nama: string;
  deskripsi: string;
  status: "Aktif" | "Selesai" | "Ditangguhkan";
  totalProduk: number;
};

export default function StoreManagementPage() {
  const [prokers, setProkers] = useState<Proker[]>([
    {
      id: "PRK-001",
      nama: "Dies Natalis ke-30",
      deskripsi: "Kepanitiaan acara ulang tahun fakultas",
      status: "Aktif",
      totalProduk: 12,
    },
    {
      id: "PRK-002",
      nama: "LKMM Dasar 2026",
      deskripsi: "Latihan Kepemimpinan Manajemen Mahasiswa",
      status: "Aktif",
      totalProduk: 5,
    },
    {
      id: "PRK-003",
      nama: "Bakti Sosial Desa",
      deskripsi: "Program pengabdian masyarakat di desa mitra",
      status: "Aktif",
      totalProduk: 3,
    },
    {
      id: "PRK-004",
      nama: "Penyambutan Maba",
      deskripsi: "Kepanitiaan penerimaan mahasiswa baru",
      status: "Selesai",
      totalProduk: 15,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProker, setCurrentProker] = useState<Partial<Proker>>({});
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const openAddModal = () => {
    setModalMode("add");
    setCurrentProker({ status: "Aktif", totalProduk: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (proker: Proker) => {
    setModalMode("edit");
    setCurrentProker(proker);
    setIsModalOpen(true);
  };

  const openDeleteModal = (proker: Proker) => {
    setCurrentProker(proker);
    setIsDeleteModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add") {
      const newProker: Proker = {
        id: `PRK-00${prokers.length + 5}`,
        nama: currentProker.nama || "Proker Baru",
        deskripsi: currentProker.deskripsi || "",
        status: currentProker.status as "Aktif" | "Selesai" | "Ditangguhkan",
        totalProduk: 0,
      };
      setProkers([...prokers, newProker]);
    } else {
      setProkers(
        prokers.map((p) =>
          p.id === currentProker.id
            ? ({ ...p, ...currentProker } as Proker)
            : p,
        ),
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setProkers(prokers.filter((p) => p.id !== currentProker.id));
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Sub-Toko (Proker)
          </h1>
          <p className="text-sm text-slate-500">
            Kelola pendaftaran, edit data, atau nonaktifkan akun panitia proker
            Anda.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Proker
        </button>
      </div>

      {/* Proker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prokers.map((proker) => (
          <motion.div
            key={proker.id}
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
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {proker.nama}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {proker.id}
                  </p>
                </div>
              </div>
              <div className="relative group">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {/* Dropdown Action (Hover based for demo simplicity) */}
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                  <button
                    onClick={() => openEditModal(proker)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(proker)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 flex-1">
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {proker.deskripsi}
              </p>

              <div className="flex justify-between items-center mt-auto">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    proker.status === "Aktif"
                      ? "bg-emerald-100 text-emerald-700"
                      : proker.status === "Selesai"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {proker.status}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {proker.totalProduk} Produk
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">
                  {modalMode === "add"
                    ? "Daftarkan Proker Baru"
                    : "Edit Profil Proker"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nama Program Kerja
                  </label>
                  <input
                    type="text"
                    required
                    value={currentProker.nama || ""}
                    onChange={(e) =>
                      setCurrentProker({
                        ...currentProker,
                        nama: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="Contoh: LKMM 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={3}
                    value={currentProker.deskripsi || ""}
                    onChange={(e) =>
                      setCurrentProker({
                        ...currentProker,
                        deskripsi: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                    placeholder="Deskripsi kegiatan..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={currentProker.status || "Aktif"}
                    onChange={(e) =>
                      setCurrentProker({
                        ...currentProker,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Ditangguhkan">Ditangguhkan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
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
                <strong>{currentProker.nama}</strong>? Semua produk dan data
                pesanan yang terkait tidak dapat dikembalikan.
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
