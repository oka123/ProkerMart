"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getInvitation(token: string) {
  const adminClient = createAdminClient();
  const { data: invite, error } = await adminClient
    .from("organisasi_invitations")
    .select("*, organisasi(nama_organisasi), sub_toko(nama_proker)")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !invite) return null;

  // Check if email already registered
  const { data: user } = await adminClient
    .from("pengguna")
    .select("id_pengguna")
    .ilike("email", invite.email)
    .maybeSingle();

  return { invite, isRegistered: !!user, id_pengguna: user?.id_pengguna || null };
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { success: false, error: "Anda harus login untuk menerima undangan." };
  }

  const adminClient = createAdminClient();
  
  // Verify token
  const { data: invite } = await adminClient
    .from("organisasi_invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return { success: false, error: "Undangan tidak valid atau sudah digunakan." };
  }

  // Ensure logged-in user matches invitation email
  if (authData.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return { success: false, error: "Email akun Anda tidak cocok dengan email undangan." };
  }

  try {
    // Determine the new role based on invitation type
    const newRole = invite.id_sub_toko ? "proker" : "organisasi";

    // Insert into organisasi_member
    const { error: insertError } = await adminClient
      .from("organisasi_member")
      .insert({
        id_organisasi: invite.id_organisasi,
        id_pengguna: authData.user.id,
        jabatan: invite.jabatan,
        id_sub_toko: invite.id_sub_toko,
      });

    if (insertError && insertError.code !== '23505') {
      throw new Error(`Gagal bergabung: ${insertError.message}`);
    }

    // Upgrade role in pengguna table (from 'pembeli' to 'organisasi' or 'proker')
    const { error: roleError } = await adminClient
      .from("pengguna")
      .update({ role: newRole })
      .eq("id_pengguna", authData.user.id);

    if (roleError) {
      console.error("[acceptInvitation] Failed to update role:", roleError);
    }

    // Update invite status
    await adminClient
      .from("organisasi_invitations")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return { success: true, isProker: !!invite.id_sub_toko };
  } catch (error: unknown) {
    console.error("[acceptInvitation]", error);
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan sistem." };
  }
}
