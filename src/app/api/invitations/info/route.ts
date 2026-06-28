import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token undangan harus disertakan." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invitation, error } = await admin
    .from("sub_toko_invitation")
    .select("email, role, status, expires_at, id_sub_toko")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Undangan tidak ditemukan atau sudah tidak berlaku." }, { status: 404 });
  }

  const { data: subToko } = await admin
    .from("sub_toko")
    .select("nama_proker")
    .eq("id_sub_toko", invitation.id_sub_toko)
    .maybeSingle();

  return NextResponse.json({
    invitation: {
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expires_at: invitation.expires_at,
      sub_toko_name: subToko?.nama_proker ?? "Sub Toko",
    },
  });
}
