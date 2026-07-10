"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";

export async function inviteAndAddMember(
  id_organisasi: string,
  email: string,
  jabatan: string,
  id_sub_toko: string | null
) {
  try {
    const adminClient = createAdminClient();

    // 1. Check if user is already a member
    const { data: existingUser } = await adminClient
      .from("pengguna")
      .select("id_pengguna")
      .ilike("email", email)
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await adminClient
        .from("organisasi_member")
        .select("id_member")
        .eq("id_organisasi", id_organisasi)
        .eq("id_pengguna", existingUser.id_pengguna)
        .maybeSingle();

      if (existingMember) {
        throw new Error("Pengguna ini sudah menjadi anggota di organisasi Anda.");
      }
    }

    // 2. Check for pending invitations
    const { data: existingInvite } = await adminClient
      .from("organisasi_invitations")
      .select("id")
      .eq("id_organisasi", id_organisasi)
      .ilike("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      throw new Error("Undangan untuk email ini sudah dikirim dan berstatus pending.");
    }

    // 3. Create the invitation record
    const { data: invite, error: inviteError } = await adminClient
      .from("organisasi_invitations")
      .insert({
        email,
        id_organisasi,
        jabatan,
        id_sub_toko: id_sub_toko || null,
      })
      .select("token")
      .single();

    if (inviteError || !invite) {
      throw new Error(`Gagal membuat undangan: ${inviteError?.message}`);
    }

    // 4. Send email via SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const appUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const inviteLink = `${appUrl}/invite/${invite.token}`;

    const mailOptions = {
      from: `"ProkerMart" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Undangan Bergabung ke Organisasi di ProkerMart",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Undangan Bergabung</h2>
          <p style="color: #334155; line-height: 1.6;">
            Anda telah diundang untuk bergabung ke sebuah Organisasi di ProkerMart sebagai <strong>${jabatan.replace(/_/g, ' ')}</strong>.
          </p>
          <p style="color: #334155; line-height: 1.6;">
            Silakan klik tombol di bawah ini untuk menerima undangan dan bergabung. Jika Anda belum memiliki akun, Anda akan diminta untuk mendaftar terlebih dahulu.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Terima Undangan
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">
            Atau salin dan tempel tautan ini ke browser Anda:<br/>
            <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error: any) {
    console.error("[inviteAndAddMember Action Error]", error);
    return { success: false, error: error.message || "Terjadi kesalahan sistem." };
  }
}
