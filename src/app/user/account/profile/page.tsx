"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Camera, Pencil, Loader2 } from "lucide-react";
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-0 md:px-4 lg:px-8 py-0 md:py-6">
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
              <div className="hidden lg:block p-6 border-b border-slate-100">
                <h2 className="text-lg font-medium text-slate-900">
                  Profil Saya
                </h2>
                <p className="text-sm text-slate-500 mt-1">
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

                <div className="lg:hidden flex flex-col items-center py-8 bg-white relative">
                  <div
                    className="relative w-24 h-24 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-2 group cursor-pointer"
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="text-white w-6 h-6" />
                    </div>
                  </div>
                  <span
                    className="text-xs text-primary-600 font-medium mt-1 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ubah Foto Profil
                  </span>
                </div>

                <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 xl:gap-12">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50 group">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Username
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 lg:bg-slate-50 lg:p-2 lg:rounded-sm break-all">
                          {formData.username}
                        </div>
                        <p className="hidden lg:block text-xs text-slate-400 mt-2">
                          Username menggunakan nama email Anda.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50 hover:bg-slate-50/50 lg:hover:bg-transparent transition-colors">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Nama
                      </label>
                      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Atur Nama Lengkap"
                          className="w-full min-w-0 lg:border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all bg-transparent lg:bg-white"
                        />
                        <ChevronRight className="lg:hidden w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Jenis Kelamin
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0 overflow-x-auto">
                        <div className="flex gap-4">
                          {["Laki-laki", "Perempuan"].map((g) => (
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
                          <select
                            className="lg:hidden bg-transparent w-full text-sm outline-none"
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
                        <ChevronRight className="lg:hidden w-5 h-5 text-slate-300 shrink-0" />
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Tanggal Lahir
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-3 min-w-0">
                        <div className="flex gap-2 w-full">
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
                            className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 bg-transparent lg:bg-white"
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
                            className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 bg-transparent lg:bg-white"
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
                            className="flex-1 min-w-0 border border-slate-200 rounded-sm px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 bg-transparent lg:bg-white"
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

                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Email
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0">
                        <div className="text-sm truncate">{formData.email}</div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center py-4 px-4 lg:px-0 border-b lg:border-none border-slate-50">
                      <label className="w-full lg:w-32 text-sm text-slate-500 lg:text-right lg:mr-6 xl:mr-8 mb-2 lg:mb-0 shrink-0">
                        Nomor Telepon
                      </label>
                      <div className="flex-1 flex items-center justify-between lg:justify-start gap-4 min-w-0">
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="Masukkan No. Handphone"
                          className="w-full lg:w-auto min-w-0 border-none lg:border border-slate-200 rounded-sm lg:px-3 lg:py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-600 transition-all bg-transparent lg:bg-white"
                        />
                      </div>
                    </div>

                    <div className="hidden lg:flex mt-8 lg:ml-38 xl:lg:ml-40">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-12 py-2 bg-primary-600 text-white font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Simpan
                      </button>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col items-center lg:w-56 xl:w-80 border-l border-slate-100 lg:px-6 xl:px-12 shrink-0">
                    <div
                      className="relative w-32 h-32 bg-slate-100 rounded-full border border-slate-200 overflow-hidden mb-4 group shrink-0 cursor-pointer"
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
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <Camera className="text-white w-8 h-8" />
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-sm hover:bg-slate-50 transition-colors mb-4 whitespace-nowrap cursor-pointer"
                    >
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

              <div className="lg:hidden p-4 bg-[#f5f5f5]">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 bg-primary-600 text-white font-medium rounded-sm shadow-md hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
