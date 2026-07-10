"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthenticated" };
  }

  const nama = formData.get("nama") as string;

  if (!nama || nama.trim() === "") {
    return { error: "Nama tidak boleh kosong." };
  }

  const { error } = await supabase
    .from("pengguna")
    .update({ nama })
    .eq("id_pengguna", user.id);

  if (error) {
    console.error("[updateProfile]", error);
    return { error: "Gagal memperbarui profil." };
  }

  return { success: true };
}
