/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { notifyOrderStatusChange } from "@/lib/notifications";

// Definisi tipe payload Webhook bawaan Supabase
interface SupabaseWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record: any;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as SupabaseWebhookPayload;

    // Pastikan ini adalah event UPDATE pada tabel pesanan
    if (payload.type === "UPDATE" && payload.table === "pesanan") {
      const oldStatus = payload.old_record?.status_pesanan;
      const newStatus = payload.record?.status_pesanan;

      // Hanya tembak notifikasi jika status benar-benar berubah
      if (oldStatus !== newStatus) {
        console.log(`[Observer Webhook] Mendeteksi perubahan status pesanan ${payload.record.kode_unik}: ${oldStatus} -> ${newStatus}`);
        
        await notifyOrderStatusChange(
          payload.record.kode_unik,
          newStatus,
          payload.record.id_pengguna
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Observer Webhook] Error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
