import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim();
    const idSubTokoFromBody = String(body.id_sub_toko || "").trim();

    if (!email || !role) {
      return NextResponse.json({ error: "Email dan jabatan harus diisi." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      return NextResponse.json({ error: "Anda harus login dulu." }, { status: 401 });
    }

    const userId = sessionData.session.user.id;
    const admin = createAdminClient();

    // Resolve sub_toko: prefer id from body (verified), fallback to auto-detect
    let subTokoId = idSubTokoFromBody || null;
    let subTokoName = "";

    if (subTokoId) {
      // Verify sender is a member of that sub_toko
      const { data: membership } = await admin
        .from("sub_toko_member")
        .select("id_member")
        .eq("id_sub_toko", subTokoId)
        .eq("id_pengguna", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Anda bukan anggota aktif sub toko ini." }, { status: 403 });
      }

      const { data: st } = await admin.from("sub_toko").select("nama_proker").eq("id_sub_toko", subTokoId).maybeSingle();
      subTokoName = st?.nama_proker ?? "Sub Toko";
    } else {
      // Auto-detect from user's owned sub_toko
      const { data: directSubToko } = await admin
        .from("sub_toko").select("id_sub_toko, nama_proker").eq("id_pengguna", userId).maybeSingle();

      if (directSubToko) {
        subTokoId = directSubToko.id_sub_toko;
        subTokoName = directSubToko.nama_proker ?? "Sub Toko";
      } else {
        return NextResponse.json({ error: "Sub toko tidak ditemukan untuk akun ini." }, { status: 404 });
      }
    }

    // Check already invited
    const { data: existing } = await admin
      .from("sub_toko_invitation")
      .select("status")
      .eq("id_sub_toko", subTokoId!)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email ini sudah memiliki undangan aktif." }, { status: 409 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const { error: insertError } = await admin.from("sub_toko_invitation").insert({
      id_sub_toko: subTokoId,
      email,
      invited_by: userId,
      token,
      role,
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json({ error: `Gagal menyimpan undangan: ${insertError.message}` }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#2563eb;padding:28px 32px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">ProkerMart</p>
            <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Platform Marketplace Ormawa</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0f172a;font-weight:600;">Anda Diundang ke Tim Proker!</p>
            <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
              Anda mendapatkan undangan untuk bergabung sebagai <strong>${role}</strong> di sub toko
              <strong>${subTokoName}</strong> di ProkerMart.
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#475569;line-height:1.6;">
              Klik tombol di bawah untuk menerima undangan. Jika Anda belum punya akun,
              Anda akan diarahkan untuk membuat akun terlebih dahulu — setelah itu akses
              ke sub toko akan otomatis diberikan.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#2563eb;border-radius:10px;">
                  <a href="${inviteUrl}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    Terima Undangan
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Atau salin tautan ini ke browser:</p>
            <p style="margin:0;font-size:12px;color:#2563eb;word-break:break-all;">
              <a href="${inviteUrl}" style="color:#2563eb;">${inviteUrl}</a>
            </p>
            <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0;" />
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Undangan ini berlaku selama <strong>7 hari</strong>. Jika Anda tidak merasa diundang, abaikan email ini.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">© ProkerMart · Platform Marketplace Ormawa</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendEmail({
      to: email,
      subject: `Undangan Bergabung ke Tim ${subTokoName} — ProkerMart`,
      html,
    });

    return NextResponse.json({ message: "Undangan berhasil dikirim.", inviteUrl });
  } catch (error) {
    console.error("[API /invitations] Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
