/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { UserSidebar } from "@/components/user/UserSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    birthDate: {
      day: "Tanggal",
      month: "Bulan",
      year: "Tahun",
    },
    foto_profil: "https://placehold.co/200x200?text=User",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/auth/login");
          return;
        }
        setUserId(user.id);

        const { data: pengguna } = await supabase
          .from("pengguna")
          .select("*")
          .eq("id_pengguna", user.id)
          .single();

        if (pengguna) {
          let bDay = "Tanggal";
          let bMonth = "Bulan";
          let bYear = "Tahun";

          if (pengguna.tanggal_lahir) {
            const date = new Date(pengguna.tanggal_lahir);
            bDay = date.getDate().toString();
            bMonth = [
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
            ][date.getMonth()];
            bYear = date.getFullYear().toString();
          }

          setFormData({
            username: pengguna.email.split("@")[0], // Mock username from email
            name: pengguna.nama || "",
            email: pengguna.email || "",
            phone: pengguna.no_telepon || "",
            gender: pengguna.jenis_kelamin || "",
            birthDate: {
              day: bDay,
              month: bMonth,
              year: bYear,
            },
            foto_profil:
              pengguna.foto_profil || "https://placehold.co/200x200?text=User",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router, supabase]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 1 MB");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`;

    setIsSaving(true);
    const toastId = toast.loading("Mengunggah foto...");

    try {
      const { error: uploadError } = await supabase.storage
        .from("profil_pengguna")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profil_pengguna")
        .getPublicUrl(fileName);

      const newPhotoUrl = data.publicUrl + "?t=" + new Date().getTime();

      const { error: dbError } = await supabase
        .from("pengguna")
        .update({ foto_profil: newPhotoUrl })
        .eq("id_pengguna", userId);

      if (dbError) throw dbError;

      setFormData({ ...formData, foto_profil: newPhotoUrl });
      toast.success("Foto profil berhasil diperbarui!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengunggah foto profil.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate birthdate
      let tanggalLahir = null;
      if (
        formData.birthDate.day !== "Tanggal" &&
        formData.birthDate.month !== "Bulan" &&
        formData.birthDate.year !== "Tahun"
      ) {
        const monthIndex = [
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
        ].indexOf(formData.birthDate.month);

        tanggalLahir = new Date(
          parseInt(formData.birthDate.year),
          monthIndex,
          parseInt(formData.birthDate.day),
        )
          .toISOString()
          .split("T")[0];
      }

      const { error } = await supabase
        .from("pengguna")
        .update({
          nama: formData.name,
          no_telepon: formData.phone,
          jenis_kelamin: formData.gender,
          tanggal_lahir: tanggalLahir,
        })
        .eq("id_pengguna", userId);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
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

      <main className="flex-1 w-full px-0 py-0 mx-auto max-w-7xl md:px-4 lg:px-8 md:py-6">
        <div className="lg:flex lg:gap-6">
          <aside className="hidden lg:block">
            <UserSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <MobileHeader
              title="Ubah Profil"
              backHref="/user"
              rightActions={[]}
              chatCount={0}
            />

            <div className="bg-white lg:rounded-sm lg:shadow-sm">
              <div className="hidden p-6 border-b lg:block border-slate-100">
                <h2 className="text-lg font-medium text-slate-900">
                  Profil Saya
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola informasi profil Anda untuk mengontrol, melindungi dan
                  mengamankan akun
                </p>
              </div>

              <div className="p-0 lg:p-8">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg, image/png"
                  className="hidden"
                />

                <div className="relative flex flex-col items-center py-8 bg-white lg:hidden">
                  <div
                    className="relative w-24 h-24 mb-2 overflow-hidden border rounded-full cursor-pointer bg-slate-100 border-slate-200 group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image
                      src={formData.foto_profil}
                      alt="Profile"
                      fill
                      className="object-cover"
                      unoptimized
                      loading="eager"
                    />
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <span
                    className="mt-1 text-xs font-medium cursor-pointer text-primary-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ubah Foto Profil
                  </span>
                </div>

                <div className="flex flex-col gap-0 lg:flex-row lg:gap-6 xl:gap-12">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col px-4 py-4 border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50 group">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Username
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium break-all text-slate-900 lg:bg-slate-50 lg:p-2 lg:rounded-sm">
                          {formData.username}
                        </div>
                        <p className="hidden mt-2 text-xs lg:block text-slate-400">
                          Username menggunakan nama email Anda.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col px-4 py-4 transition-colors border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50 hover:bg-slate-50/50 lg:hover:bg-transparent">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Nama
                      </label>
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Atur Nama Lengkap"
                          className="w-full min-w-0 px-3 py-2 text-sm transition-all bg-transparent rounded-sm lg:border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600 lg:bg-white"
                        />
                        <ChevronRight className="w-5 h-5 lg:hidden text-slate-300 shrink-0" />
                      </div>
                    </div>

                    <div className="flex flex-col px-4 py-4 border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Jenis Kelamin
                      </label>
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-4 overflow-x-auto lg:justify-start">
                        <div className="flex gap-4">
                          {["Laki-laki", "Perempuan"].map((g) => (
                            <label
                              key={g}
                              className="items-center hidden gap-2 cursor-pointer lg:flex whitespace-nowrap"
                            >
                              <input
                                type="radio"
                                name="gender"
                                checked={formData.gender === g}
                                onChange={() =>
                                  setFormData({ ...formData, gender: g })
                                }
                                className="w-4 h-4 accent-primary-600"
                              />
                              <span className="text-sm">{g}</span>
                            </label>
                          ))}
                          <select
                            className="w-full text-sm bg-transparent outline-none lg:hidden"
                            value={formData.gender || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gender: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Pilih
                            </option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <ChevronRight className="w-5 h-5 lg:hidden text-slate-300 shrink-0" />
                      </div>
                    </div>

                    <div className="flex flex-col px-4 py-4 border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Tanggal Lahir
                      </label>
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-3 lg:justify-start">
                        <div className="flex w-full gap-2">
                          <select
                            value={formData.birthDate.day}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                birthDate: {
                                  ...formData.birthDate,
                                  day: e.target.value,
                                },
                              })
                            }
                            className="flex-1 min-w-0 px-2 py-2 text-sm bg-transparent border rounded-sm border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600 lg:bg-white"
                          >
                            <option disabled>Tanggal</option>
                            {Array.from({ length: 31 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.birthDate.month}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                birthDate: {
                                  ...formData.birthDate,
                                  month: e.target.value,
                                },
                              })
                            }
                            className="flex-1 min-w-0 px-2 py-2 text-sm bg-transparent border rounded-sm border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600 lg:bg-white"
                          >
                            <option disabled>Bulan</option>
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
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.birthDate.year}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                birthDate: {
                                  ...formData.birthDate,
                                  year: e.target.value,
                                },
                              })
                            }
                            className="flex-1 min-w-0 px-2 py-2 text-sm bg-transparent border rounded-sm border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600 lg:bg-white"
                          >
                            <option disabled>Tahun</option>
                            {Array.from({ length: 50 }, (_, i) => (
                              <option key={2026 - i} value={2026 - i}>
                                {2026 - i}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col px-4 py-4 border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Email
                      </label>
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-4 lg:justify-start">
                        <div className="text-sm truncate">{formData.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-col px-4 py-4 border-b lg:flex-row lg:items-center lg:px-0 lg:border-none border-slate-50">
                      <label className="w-full mb-2 text-sm lg:w-32 text-slate-500 lg:text-right lg:mr-6 xl:mr-8 lg:mb-0 shrink-0">
                        Nomor Telepon
                      </label>
                      <div className="flex items-center justify-between flex-1 min-w-0 gap-4 lg:justify-start">
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="Masukkan No. Telepon"
                          className="w-full min-w-0 px-3 py-2 text-sm transition-all bg-transparent rounded-sm lg:border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-600 lg:bg-white"
                        />
                      </div>
                    </div>

                    <div className="hidden mt-8 lg:flex lg:ml-38 xl:lg:ml-40">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-12 py-2 font-medium text-white transition-all rounded-sm shadow-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isSaving && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Simpan
                      </button>
                    </div>
                  </div>

                  <div className="flex-col items-center hidden border-l lg:flex lg:w-56 xl:w-80 border-slate-100 lg:px-6 xl:px-12 shrink-0">
                    <div
                      className="relative w-32 h-32 mb-4 overflow-hidden border rounded-full cursor-pointer bg-slate-100 border-slate-200 group shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image
                        src={formData.foto_profil}
                        alt="Profile Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        loading="eager"
                      />
                      <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 cursor-pointer bg-black/40 group-hover:opacity-100">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 mb-4 text-sm font-medium transition-colors border rounded-sm cursor-pointer border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                    >
                      Pilih Gambar
                    </button>
                    <div className="space-y-1 text-center">
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

              <div className="lg:hidden p-4 bg-[#f5f5f5]">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center w-full gap-2 py-3 font-medium text-white transition-all rounded-sm shadow-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
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
