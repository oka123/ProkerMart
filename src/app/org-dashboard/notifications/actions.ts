"use server";

import { createClient } from "@/lib/supabase/server";

export async function markAsRead(id_notifikasi: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifikasi")
    .update({ 
      status_dibaca: true,
      tgl_baca: new Date().toISOString()
    })
    .eq("id_notifikasi", id_notifikasi)
    .eq("id_pengguna", user.id);

  if (error) {
    console.error("[markAsRead]", error);
    return { error: "Gagal menandai notifikasi." };
  }

  return { success: true };
}

export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifikasi")
    .update({ 
      status_dibaca: true,
      tgl_baca: new Date().toISOString()
    })
    .eq("id_pengguna", user.id)
    .eq("status_dibaca", false);

  if (error) {
    console.error("[markAllAsRead]", error);
    return { error: "Gagal menandai notifikasi." };
  }

  return { success: true };
}
