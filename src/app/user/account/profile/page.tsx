"use client";

import { useState } from "react";
import { ChevronRight, Camera, Pencil } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    username: "Andi123",
    name: "",
    email: "an*********@gmail.com",
    phone: "*********72",
    storeName: "Andi123",
    gender: "Laki-laki",
    birthDate: {
      day: "Tanggal",
      month: "Bulan",
      year: "Tahun",
    },
    bio: "",
  });

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Header */}
            <MobileHeader
              title="Ubah Profil"
              backHref="/user/purchase"
              rightActions={[]}
              chatCount={1}
            />

            {/* Content Container */}
            <div className="bg-white lg:rounded-sm lg:shadow-sm">
              {/* Desktop Header */}
              <div className="hidden lg:block p-6 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-900">
                  Profil Saya
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Kelola informasi profil Anda untuk mengontrol, melindungi dan
                  mengamankan akun
                </p>
              </div>

              {/* Form & Avatar Layout */}
              <div className="p-0 lg:p-8">
                {/* Mobile Avatar Section */}
                <div className="lg:hidden flex flex-col items-center py-8 bg-white">
                  <div className="relative w-20 h-20 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-2">
                    <Image
                      src="https://placehold.co/200x200?text=User"
                      alt="Profile"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <button className="flex items-center gap-1 text-slate-500 text-sm">
                    <Pencil className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 xl:gap-12">
                  {/* Left Side: Form (Desktop) / List (Mobile) */}
                  <div className="flex-1 min-w-0">
                    {/* Username Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50 group">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Username
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 lg:bg-slate-50 lg:p-2 lg:rounded-sm break-all">
                          {formData.username}
                        </div>
                        <p className="hidden lg:block text-xs text-slate-400 mt-2">
                          Username hanya dapat diubah satu (1) kali.
                        </p>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50 hover:bg-slate-50/50 lg:hover:bg-transparent transition-colors">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Nama
                      </label>
                      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                        <input
                          type="text"
                          placeholder={formData.name || "Atur Sekarang"}
                          className="w-full min-w-0 lg:border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all bg-transparent lg:bg-white"
                        />
                        <ChevronRight className="lg:hidden w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    {/* Bio Field (Mobile Only in list) */}
                    <div className="lg:hidden flex items-center py-4 px-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <label className="w-32 text-sm text-slate-500 shrink-0">
                        Bio
                      </label>
                      <div className="flex-1 flex items-center justify-between text-right min-w-0 gap-2">
                        <span className="text-sm text-slate-400 truncate">
                          Atur Sekarang
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    {/* Gender Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Jenis Kelamin
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0 overflow-x-auto no-scrollbar">
                        <div className="flex gap-4">
                          {["Laki-laki", "Perempuan", "Lainnya"].map((g) => (
                            <label
                              key={g}
                              className="hidden lg:flex items-center gap-2 cursor-pointer whitespace-nowrap"
                            >
                              <input
                                type="radio"
                                name="gender"
                                checked={formData.gender === g}
                                onChange={() =>
                                  setFormData({ ...formData, gender: g })
                                }
                                className="accent-primary-600 w-4 h-4"
                              />
                              <span className="text-sm">{g}</span>
                            </label>
                          ))}
                          <span className="lg:hidden text-sm text-slate-900 whitespace-nowrap">
                            {formData.gender || "Atur Sekarang"}
                          </span>
                        </div>
                        <ChevronRight className="lg:hidden w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    {/* Birth Date Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Tanggal Lahir
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-3 min-w-0">
                        <div className="hidden lg:flex gap-2 w-full">
                          <select className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600">
                            <option>Tanggal</option>
                            {Array.from({ length: 31 }, (_, i) => (
                              <option key={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <select className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600">
                            <option>Bulan</option>
                            {[
                              "Januari",
                              "Februari",
                              "Maret",
                              "April",
                              "Mei",
                              "Juni",
                              "Juli",
                              "Agustus",
                              "September",
                              "Oktober",
                              "November",
                              "Desember",
                            ].map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                          <select className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600">
                            <option>Tahun</option>
                            {Array.from({ length: 50 }, (_, i) => (
                              <option key={2024 - i}>{2024 - i}</option>
                            ))}
                          </select>
                        </div>
                        <span className="lg:hidden text-sm text-slate-900">
                          Atur Sekarang
                        </span>
                        <ChevronRight className="lg:hidden w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Email
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0">
                        <div className="text-sm truncate">{formData.email}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button className="text-primary-600 text-xs hover:underline">
                            Ubah
                          </button>
                          <ChevronRight className="lg:hidden w-5 h-5 text-slate-300" />
                        </div>
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Nomor Telepon
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0">
                        <div className="text-sm truncate">{formData.phone}</div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button className="text-primary-600 text-xs hover:underline">
                            Ubah
                          </button>
                          <ChevronRight className="lg:hidden w-5 h-5 text-slate-300" />
                        </div>
                      </div>
                    </div>

                    {/* Store Name Field (Desktop Only) */}
                    <div className="hidden lg:flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Nama Toko
                      </label>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          defaultValue={formData.storeName}
                          className="w-full min-w-0 border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Save Button (Desktop) */}
                    <div className="hidden lg:flex mt-8 lg:ml-38 xl:lg:ml-40">
                      <button className="px-12 py-2 bg-primary-600 text-white font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all">
                        Simpan
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Avatar Upload (Desktop Only) */}
                  <div className="hidden lg:flex flex-col items-center lg:w-56 xl:w-80 border-l border-slate-100 lg:px-6 xl:px-12 shrink-0">
                    <div className="relative w-24 h-24 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-4 group shrink-0">
                      <Image
                        src="https://placehold.co/200x200?text=User"
                        alt="Profile Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <Camera className="text-white w-6 h-6" />
                      </div>
                    </div>
                    <button className="px-6 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors mb-4 whitespace-nowrap">
                      Pilih Gambar
                    </button>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-slate-400">
                        Ukuran gambar: maks. 1 MB
                      </p>
                      <p className="text-xs text-slate-400">
                        Format gambar: .JPEG, .PNG
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Save Button (Floating or Bottom) */}
              <div className="lg:hidden p-4 bg-[#f5f5f5]">
                <button className="w-full py-3 bg-primary-600 text-white font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
