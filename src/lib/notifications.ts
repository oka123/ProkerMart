/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import webpush from "web-push";

// Initialize Supabase Admin client to bypass RLS for background tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:indigokomplain010@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465, // Usually 465 for secure, 587 for TLS
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const formatStatusText = (status: string) => {
  const map: Record<string, string> = {
    menunggu_pembayaran: "Menunggu Pembayaran",
    menunggu_konfirmasi: "Menunggu Konfirmasi",
    diproses: "Sedang Diproses",
    siap_diambil: "Siap Diambil",
    dikirim: "Sedang Dikirim",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
    kadaluarsa: "Kadaluarsa",
  };
  return map[status] || status.replace(/_/g, " ");
};

export async function notifyOrderStatusChange(
  kodeUnik: string,
  newStatus: string,
  userId: string,
) {
  try {
    // 1. Fetch user data for Email & Name
    const { data: user, error: userError } = await supabase
      .from("pengguna")
      .select("email, nama")
      .eq("id_pengguna", userId)
      .single();

    if (userError || !user) {
      console.error("[Notifications] Failed to fetch user:", userError);
      return;
    }

    const statusText = formatStatusText(newStatus);
    const title = `Status Pesanan Diperbarui`;
    const message = `Pesanan Anda dengan kode ${kodeUnik} sekarang memiliki status: ${statusText}.`;

    const detailUrl = `/user/purchase/${kodeUnik}`;

    // 2. Insert In-App Notification
    const { error: notifError } = await supabase.from("notifikasi").insert({
      id_pengguna: userId,
      judul: title,
      konten: message,
      link_terkait: detailUrl,
    });

    if (notifError) {
      console.error(
        "[Notifications] Failed to insert in-app notif:",
        notifError,
      );
    }

    // 3. Send Email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const fullDetailUrl = `${appUrl}${detailUrl}`;

      await transporter.sendMail({
        from: `"ProkerMart" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `Update Pesanan ProkerMart: ${statusText}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 24px;">ProkerMart</h1>
            </div>
            <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 15px;">Halo, ${user.nama}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              Status pesanan Anda dengan kode unik <strong style="color: #0f172a;">${kodeUnik}</strong> telah diperbarui menjadi:
            </p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb; text-align: center;">
              <h3 style="color: #2563eb; margin: 0; font-size: 22px;">${statusText}</h3>
            </div>
            <p style="color: #475569; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
              Klik tombol di bawah ini untuk melihat detail lengkap pesanan Anda.
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${fullDetailUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Lihat Detail Pesanan</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.5;">
              Jika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami.<br/>
              &copy; ${new Date().getFullYear()} ProkerMart. Hak Cipta Dilindungi.
            </p>
          </div>
        `,
      });
      console.log(`[Notifications] Email sent to ${user.email}`);
    } catch (emailError) {
      console.error("[Notifications] Failed to send email:", emailError);
    }

    // 4. Send Web Push
    try {
      const { data: subs, error: subsError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("id_pengguna", userId);

      if (!subsError && subs && subs.length > 0) {
        const payload = JSON.stringify({
          title,
          body: message,
          url: detailUrl,
        });

        const pushPromises = subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
            );
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              // Subscription has expired or is no longer valid, delete it
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            } else {
              console.error("[Notifications] Push error for sub", sub.id, e);
            }
          }
        });

        await Promise.all(pushPromises);
        console.log(`[Notifications] Web push sent to ${subs.length} devices.`);
      }
    } catch (pushError) {
      console.error("[Notifications] Failed to process web push:", pushError);
    }
  } catch (error) {
    console.error("[Notifications] Unhandled error:", error);
  }
}
