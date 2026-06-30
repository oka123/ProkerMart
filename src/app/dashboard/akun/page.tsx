/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function DashboardAkunPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
          .select("nama, email, foto_profil")
          .eq("id_pengguna", user.id)
          .single();

        if (pengguna) {
          setFormData({
            name: pengguna.nama || "",
            email: pengguna.email || "",
            foto_profil: pengguna.foto_profil || "https://placehold.co/200x200?text=User",
          });
        }
      } catch (error) {
        console.error("[DashboardAkun - fetchProfile] Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router, supabase]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const { data } = supabase.storage.from("profil_pengguna").getPublicUrl(fileName);
      const newPhotoUrl = data.publicUrl + "?t=" + new Date().getTime();

      const { error: dbError } = await supabase
        .from("pengguna")
        .update({ foto_profil: newPhotoUrl })
        .eq("id_pengguna", userId);

      if (dbError) throw dbError;

      setFormData((prev) => ({ ...prev, foto_profil: newPhotoUrl }));
      toast.success("Foto profil berhasil diperbarui!", { id: toastId });
    } catch (error: any) {
      console.error("[DashboardAkun - handleFileUpload] Error:", error);
      toast.error(error.message || "Gagal mengunggah foto profil.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("pengguna")
        .update({ nama: formData.name })
        .eq("id_pengguna", userId);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      console.error("[DashboardAkun - handleSave] Error:", error);
      toast.error(error.message || "Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Akun Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola informasi profil Anda</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg, image/png"
          className="hidden"
        />

        <div className="flex items-center gap-5">
          <div
            className="relative w-20 h-20 overflow-hidden border rounded-full cursor-pointer bg-slate-100 border-slate-200 group shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image
              src={formData.foto_profil}
              alt="Foto Profil"
              fill
              className="object-cover"
              unoptimized
              loading="eager"
            />
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 text-sm font-medium border rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Ganti Foto
            </button>
            <p className="text-xs text-slate-400 mt-1.5">Maks. 1 MB · JPEG, PNG</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              className="w-full px-3 py-2.5 text-sm border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full px-3 py-2.5 text-sm border rounded-lg border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/dashboard/akun/password"
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            Ubah Password
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
