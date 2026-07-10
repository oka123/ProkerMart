import { createClient } from "@/lib/supabase/client";

export interface UserAccess {
  idPengguna: string;
  role: string;
  hasOrganisasi: boolean;
  hasProker: boolean;
  needsSelection: boolean;
}

export async function fetchUserAccess(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<UserAccess | null> {
  const { data: pengguna } = await supabase
    .from("pengguna")
    .select("id_pengguna, role")
    .eq("email", email)
    .single();

  if (!pengguna) return null;

  const [orgResult, allOrgMemberships, prokerResult] = await Promise.all([
    supabase
      .from("organisasi")
      .select("id_pengguna")
      .eq("id_pengguna", pengguna.id_pengguna)
      .maybeSingle(),
    supabase
      .from("organisasi_member")
      .select("id_sub_toko")
      .eq("id_pengguna", pengguna.id_pengguna),
    supabase
      .from("sub_toko_member")
      .select("id_member")
      .eq("id_pengguna", pengguna.id_pengguna)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  const orgMembers = allOrgMemberships.data || [];
  const isCoreOrg = orgMembers.some((m) => !m.id_sub_toko);
  // isProkerOrg: only counts if they are also in sub_toko_member (actual proker manager)
  // Having an id_sub_toko in organisasi_member just means they were assigned to help a proker
  // but the actual dashboard access is controlled by sub_toko_member

  // Fallback to role field if no member records exist yet
  const hasOrganisasi = !!orgResult.data || isCoreOrg || pengguna.role === "organisasi";
  const hasProker = !!prokerResult.data || pengguna.role === "proker";

  return {
    idPengguna: pengguna.id_pengguna,
    role: pengguna.role,
    hasOrganisasi,
    hasProker,
    needsSelection: hasOrganisasi || hasProker,
  };
}
