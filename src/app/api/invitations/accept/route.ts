import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "Token undangan tidak ditemukan." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      return NextResponse.json(
        { error: "Anda harus login sebelum menerima undangan." },
        { status: 401 },
      );
    }

    const user = sessionData.session.user;
    const admin = createAdminClient();

    const { data: invitation, error: invitationError } = await admin
      .from("sub_toko_invitation")
      .select("id_invitation, id_sub_toko, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: "Undangan tidak ditemukan atau sudah tidak berlaku." },
        { status: 404 },
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "Undangan ini sudah pernah dikonfirmasi." },
        { status: 409 },
      );
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Undangan sudah kadaluarsa." },
        { status: 410 },
      );
    }

    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: "Email login tidak cocok dengan email undangan." },
        { status: 403 },
      );
    }

    const { data: existingMember } = await admin
      .from("sub_toko_member")
      .select("id_member")
      .match({
        id_sub_toko: invitation.id_sub_toko,
        id_pengguna: user.id,
      })
      .maybeSingle();

    if (!existingMember) {
      const { error: memberError } = await admin.from("sub_toko_member").insert({
        id_sub_toko: invitation.id_sub_toko,
        id_pengguna: user.id,
        role: invitation.role,
        status: "active",
      });

      if (memberError) {
        return NextResponse.json(
          { error: `Gagal menambahkan anggota: ${memberError.message}` },
          { status: 500 },
        );
      }
    }

    const userMetadata = {
      ...(user.user_metadata ?? {}),
      role: "proker",
      proker_role: invitation.role,
    };

    const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: userMetadata,
    });

    if (authUpdateError) {
      return NextResponse.json(
        { error: `Gagal memperbarui metadata pengguna: ${authUpdateError.message}` },
        { status: 500 },
      );
    }

    const { error: updateError } = await admin
      .from("sub_toko_invitation")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id_invitation", invitation.id_invitation);

    if (updateError) {
      return NextResponse.json(
        { error: `Gagal memperbarui status undangan: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Undangan berhasil diterima." });
  } catch (error) {
    console.error("[API /invitations/accept] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
