"use client";

import { useState } from "react";
import { Plus, MapPin, ChevronRight, Trash2, MapPinned, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
  id: number;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  streetDetails: string;
  extraDetails?: string;
  isMain: boolean;
  type: "Rumah" | "Kantor";
}

const initialAddresses: Address[] = [
  {
    id: 1,
    name: "Test1",
    phone: "(+62) 8123123",
    province: "Test",
    city: "KAB. Test",
    district: "Test",
    postalCode: "12345",
    streetDetails: "Jl. Test",
    isMain: true,
    type: "Rumah",
  },
  {
    id: 2,
    name: "Test2",
    phone: "(+62) 8123123",
    province: "Test",
    city: "KAB. Test",
    district: "Test",
    postalCode: "12345",
    streetDetails: "Jl. Test",
    isMain: false,
    type: "Rumah",
  },
];

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  const handleOpenModal = (address: Address | null = null) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingAddress(null);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: number) => {
    setAddressToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (addressToDelete) {
      setAddresses(addresses.filter((a) => a.id !== addressToDelete));
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
    }
  };

  const setAsMain = (id: number) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isMain: a.id === id,
      })),
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block shrink-0">
            <UserSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Header */}
            <MobileHeader
              title="Alamat Saya"
              backHref="/user/account/profile"
              rightActions={[]}
            />

            {/* Content Container */}
            <div className="bg-white lg:rounded-sm lg:shadow-sm min-h-150 flex flex-col">
              {/* Desktop Header */}
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

              {/* Address List */}
              <div className="flex-1">
                <div className="px-4 lg:px-6 py-2 border-b border-slate-50 lg:hidden">
                  <span className="text-sm text-slate-400 font-medium">
                    Alamat
                  </span>
                </div>

                {addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-4 lg:p-6 border-b border-slate-100 last:border-none hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1 space-y-1">
                          {/* Name & Phone */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 border-r pr-2 border-slate-200">
                              {address.name}
                            </span>
                            <span className="text-slate-500 text-sm">
                              {address.phone}
                            </span>
                            {address.isMain && (
                              <span className="px-1.5 py-0.5 border border-primary-600 text-primary-600 text-[10px] uppercase font-bold rounded-sm ml-2">
                                Utama
                              </span>
                            )}
                          </div>

                          {/* Address Details */}
                          <div className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                            <p>{address.streetDetails}</p>
                            <p>
                              {address.district}, {address.city},{" "}
                              {address.province}, ID {address.postalCode}
                            </p>
                          </div>

                          {/* Type Badge (Mobile Only) */}
                          <div className="lg:hidden mt-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-sm">
                              {address.type}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <div className="flex items-center gap-4 text-sm font-medium">
                            <button
                              onClick={() => handleOpenModal(address)}
                              className="text-primary-600 hover:underline"
                            >
                              Ubah
                            </button>
                            {!address.isMain && (
                              <button
                                onClick={() => handleDeleteClick(address.id)}
                                className="text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          <button
                            disabled={address.isMain}
                            onClick={() => setAsMain(address.id)}
                            className={`px-3 py-1.5 border rounded-sm text-sm transition-all ${
                              address.isMain
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

            {/* Mobile Sticky Button */}
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
              className="relative bg-white w-full h-full lg:h-auto lg:max-w-xl lg:rounded-md shadow-xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
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

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                {/* Auto Fill Info (Shopee Style) */}
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 flex gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold">Tempel dan Isi Otomatis</p>
                    <p className="text-slate-500">
                      Tempel atau masukkan informasi. Klik &quot;Isi&quot; untuk
                      mengisi nama, no. HP, dan alamat.
                    </p>
                    <div className="mt-2 bg-white border border-slate-200 rounded p-2 text-slate-300">
                      Tempel atau masukkan informasi...
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      defaultValue={editingAddress?.name}
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                    <input
                      type="text"
                      placeholder="Nomor Telepon"
                      defaultValue={editingAddress?.phone}
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Provinsi, Kota, Kecamatan, Kode Pos"
                      defaultValue={
                        editingAddress
                          ? `${addressingToString(editingAddress)}`
                          : ""
                      }
                      readOnly
                      className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm pr-10 cursor-pointer bg-slate-50/30"
                    />
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>

                  <textarea
                    placeholder="Nama Jalan, Gedung, No. Rumah"
                    rows={2}
                    defaultValue={editingAddress?.streetDetails}
                    className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 resize-none"
                  />

                  <input
                    type="text"
                    placeholder="Detail Lainnya (Cth: Blok / Unit No., Patokan)"
                    className="w-full border border-slate-200 rounded-sm px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Atur sebagai Alamat Utama
                    </span>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
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
                          className={`px-6 py-2 border rounded-sm text-sm transition-all ${
                            (editingAddress?.type || "Rumah") === type
                              ? "border-primary-600 text-primary-600"
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

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex gap-3 lg:justify-end">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 lg:flex-none px-8 py-2 border border-slate-200 text-slate-600 rounded-sm hover:bg-slate-50 transition-all"
                >
                  Nanti Saja
                </button>
                <button className="flex-1 lg:flex-none px-12 py-2 bg-primary-600 text-white rounded-sm hover:bg-primary-700 shadow-md transition-all font-medium">
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

function addressingToString(addr: Address) {
  return `${addr.province}, ${addr.city}, ${addr.district}, ${addr.postalCode}`;
}
