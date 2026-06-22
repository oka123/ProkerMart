"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  MapPin,
  ChevronRight,
  Trash2,
  MapPinned,
  X,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(
  () => import("@/components/user/LocationPickerMap"),
  { ssr: false },
);

interface Address {
  id_alamat: string;
  nama_penerima: string;
  no_telepon: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kode_pos: string;
  detail_jalan: string;
  catatan_tambahan: string;
  is_utama: boolean;
  tipe_alamat: string;
  latitude: number | null;
  longitude: number | null;
}

export default function AddressPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [userId, setUserId] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama_penerima: "",
    no_telepon: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kode_pos: "",
    detail_jalan: "",
    catatan_tambahan: "",
    tipe_alamat: "Rumah",
    is_utama: false,
    latitude: -8.7963,
    longitude: 115.1765,
  });

  const fetchAddresses = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("alamat_pembeli")
        .select("*")
        .eq("id_pengguna", uid)
        .order("is_utama", { ascending: false })
        .order("tgl_dibuat", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      await fetchAddresses(user.id);
      setIsLoading(false);
    }
    init();
  }, [router, supabase]);

  const handleOpenModal = (address: Address | null = null) => {
    setEditingAddress(address);
    if (address) {
      setFormData({
        nama_penerima: address.nama_penerima,
        no_telepon: address.no_telepon,
        provinsi: address.provinsi,
        kota: address.kota,
        kecamatan: address.kecamatan,
        kode_pos: address.kode_pos,
        detail_jalan: address.detail_jalan,
        catatan_tambahan: address.catatan_tambahan || "",
        tipe_alamat: address.tipe_alamat || "Rumah",
        is_utama: address.is_utama,
        latitude: address.latitude || -8.7963,
        longitude: address.longitude || 115.1765,
      });
    } else {
      setFormData({
        nama_penerima: "",
        no_telepon: "",
        provinsi: "",
        kota: "",
        kecamatan: "",
        kode_pos: "",
        detail_jalan: "",
        catatan_tambahan: "",
        tipe_alamat: "Rumah",
        is_utama: addresses.length === 0, // First address is automatically main
        latitude: -8.7963,
        longitude: 115.1765,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingAddress(null);
    setIsModalOpen(false);
  };

  const handleSaveAddress = async () => {
    if (
      !formData.nama_penerima ||
      !formData.no_telepon ||
      !formData.detail_jalan ||
      !formData.provinsi ||
      !formData.kota ||
      !formData.kecamatan ||
      !formData.kode_pos
    ) {
      toast.error("Mohon lengkapi semua data alamat.");
      return;
    }

    setIsSaving(true);
    try {
      // If setting as main, we need to remove main from others first
      if (formData.is_utama) {
        await supabase
          .from("alamat_pembeli")
          .update({ is_utama: false })
          .eq("id_pengguna", userId)
          .eq("is_utama", true);
      }

      if (editingAddress) {
        // Update
        const { error } = await supabase
          .from("alamat_pembeli")
          .update(formData)
          .eq("id_alamat", editingAddress.id_alamat);
        if (error) throw error;
        toast.success("Alamat berhasil diperbarui");
      } else {
        // Insert
        const { error } = await supabase
          .from("alamat_pembeli")
          .insert([{ ...formData, id_pengguna: userId }]);
        if (error) throw error;
        toast.success("Alamat berhasil ditambahkan");
      }

      await fetchAddresses(userId);
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan alamat");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setAddressToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (addressToDelete) {
      try {
        const { error } = await supabase
          .from("alamat_pembeli")
          .delete()
          .eq("id_alamat", addressToDelete);

        if (error) throw error;
        toast.success("Alamat berhasil dihapus");
        await fetchAddresses(userId);
      } catch (error: any) {
        toast.error("Gagal menghapus alamat");
      } finally {
        setIsDeleteModalOpen(false);
        setAddressToDelete(null);
      }
    }
  };

  const setAsMain = async (id: string) => {
    try {
      // Remove previous main
      await supabase
        .from("alamat_pembeli")
        .update({ is_utama: false })
        .eq("id_pengguna", userId)
        .eq("is_utama", true);

      // Set new main
      const { error } = await supabase
        .from("alamat_pembeli")
        .update({ is_utama: true })
        .eq("id_alamat", id);

      if (error) throw error;
      toast.success("Alamat utama diperbarui");
      await fetchAddresses(userId);
    } catch (error) {
      toast.error("Gagal mengatur alamat utama");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

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
              title="Alamat Saya"
              backHref="/user/account/profile"
              rightActions={[]}
            />

            <div className="bg-white lg:rounded-sm lg:shadow-sm min-h-112.5 flex flex-col">
              <div className="hidden lg:flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-900">
                  Alamat Saya
                </h2>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambahkan Alamat Baru</span>
                </button>
              </div>

              <div className="flex-1">
                <div className="px-4 lg:px-6 py-2 border-b border-slate-50 lg:hidden">
                  <span className="text-sm text-slate-400 font-medium">
                    Alamat
                  </span>
                </div>

                {addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address.id_alamat}
                      className="p-4 lg:p-6 border-b border-slate-100 last:border-none hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 border-r pr-2 border-slate-200">
                              {address.nama_penerima}
                            </span>
                            <span className="text-slate-500 text-sm">
                              {address.no_telepon}
                            </span>
                            {address.is_utama && (
                              <span className="px-1.5 py-0.5 border border-primary-600 text-primary-600 text-[10px] uppercase font-bold rounded-sm ml-2">
                                Utama
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                            <p>{address.detail_jalan}</p>
                            <p>
                              {address.kecamatan}, {address.kota},{" "}
                              {address.provinsi}, ID {address.kode_pos}
                            </p>
                          </div>

                          <div className="lg:hidden mt-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-sm">
                              {address.tipe_alamat}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="flex items-center gap-4 text-sm font-medium">
                            <button
                              onClick={() => handleOpenModal(address)}
                              className="text-primary-600 hover:underline"
                            >
                              Ubah
                            </button>
                            {!address.is_utama && (
                              <button
                                onClick={() =>
                                  handleDeleteClick(address.id_alamat)
                                }
                                className="text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          <button
                            disabled={address.is_utama}
                            onClick={() => setAsMain(address.id_alamat)}
                            className={`px-3 py-1.5 border rounded-sm text-sm transition-all ${
                              address.is_utama
                                ? "border-slate-200 text-slate-400 cursor-default"
                                : "border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Atur sebagai utama
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <MapPinned className="w-16 h-16 mb-4 opacity-20" />
                    <p>Belum ada alamat tersimpan</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:hidden p-4 sticky bottom-0 bg-[#f5f5f5]">
              <button
                onClick={() => handleOpenModal()}
                className="w-full flex items-center justify-center gap-2 py-3 border border-primary-600 text-primary-600 font-medium rounded-sm bg-white hover:bg-primary-50 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Tambah Alamat Baru</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Address Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-0 lg:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative bg-white w-full h-full lg:h-auto lg:max-h-[90vh] lg:max-w-xl lg:rounded-md shadow-xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-lg font-medium text-slate-900">
                  {editingAddress ? "Ubah Alamat" : "Alamat Baru"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-none p-4 lg:p-6 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nama Penerima"
                      value={formData.nama_penerima}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nama_penerima: e.target.value,
                        })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                    <input
                      type="text"
                      placeholder="Nomor Telepon"
                      value={formData.no_telepon}
                      onChange={(e) =>
                        setFormData({ ...formData, no_telepon: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Provinsi"
                      value={formData.provinsi}
                      onChange={(e) =>
                        setFormData({ ...formData, provinsi: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                    <input
                      type="text"
                      placeholder="Kota / Kabupaten"
                      value={formData.kota}
                      onChange={(e) =>
                        setFormData({ ...formData, kota: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                    <input
                      type="text"
                      placeholder="Kecamatan"
                      value={formData.kecamatan}
                      onChange={(e) =>
                        setFormData({ ...formData, kecamatan: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                    <input
                      type="text"
                      placeholder="Kode Pos"
                      value={formData.kode_pos}
                      onChange={(e) =>
                        setFormData({ ...formData, kode_pos: e.target.value })
                      }
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                  </div>

                  <textarea
                    placeholder="Nama Jalan, Gedung, No. Rumah"
                    rows={2}
                    value={formData.detail_jalan}
                    onChange={(e) =>
                      setFormData({ ...formData, detail_jalan: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Catatan Tambahan (Cth: Blok / Unit No., Patokan)"
                    value={formData.catatan_tambahan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        catatan_tambahan: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Titik Koordinat Lokasi
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setFormData({
                                  ...formData,
                                  latitude: position.coords.latitude,
                                  longitude: position.coords.longitude,
                                });
                              },
                              () => {
                                toast.error(
                                  "Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.",
                                );
                              },
                            );
                          }
                        }}
                        className="text-xs text-primary-600 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        Gunakan Lokasi Saat Ini
                      </button>
                    </div>
                    <div className="w-full h-48 bg-slate-100 rounded-sm overflow-hidden z-0">
                      <LocationPickerMap
                        initialLocation={{
                          lat: formData.latitude,
                          lng: formData.longitude,
                        }}
                        onChange={(loc) =>
                          setFormData({
                            ...formData,
                            latitude: loc.lat,
                            longitude: loc.lng,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Geser pin pada peta untuk menentukan titik koordinat yang
                      lebih presisi.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Atur sebagai Alamat Utama
                    </span>
                    <div
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.is_utama ? "bg-primary-600" : "bg-slate-200"}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          is_utama: !formData.is_utama,
                        })
                      }
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_utama ? "left-7" : "left-1"}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-sm text-slate-500">
                      Tandai Sebagai:
                    </span>
                    <div className="flex gap-3">
                      {["Kantor", "Rumah"].map((type) => (
                        <button
                          key={type}
                          onClick={() =>
                            setFormData({ ...formData, tipe_alamat: type })
                          }
                          className={`px-6 py-2 border rounded-sm text-sm transition-all ${
                            formData.tipe_alamat === type
                              ? "border-primary-600 text-primary-600 bg-primary-50"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex gap-3 lg:justify-end">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 lg:flex-none px-8 py-2 border border-slate-200 text-slate-600 rounded-sm hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={isSaving}
                  className="flex-1 lg:flex-none px-12 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 shadow-md transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-6 rounded-md shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Hapus Alamat?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Apakah Anda yakin ingin menghapus alamat ini? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-sm hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-sm hover:bg-red-700 font-medium shadow-sm transition-all"
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
