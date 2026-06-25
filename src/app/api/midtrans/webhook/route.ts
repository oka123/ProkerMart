/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Inisialisasi Supabase dengan Service Role Key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    const notification = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      fraud_status,
      signature_key,
      payment_type,
    } = notification;

    // ─── 1. Verifikasi Signature Key ─────────────────────────────────────────
    //        Ini wajib ada untuk mencegah request palsu dari pihak luar.
    //        Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const rawString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(rawString)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.warn("Signature tidak valid! Request mungkin palsu.");
      return NextResponse.json(
        { error: "Signature tidak valid" },
        { status: 403 },
      );
    }

    // ─── 2. Tentukan status_pesanan berdasarkan status dari Midtrans ─────────
    //        Dokumentasi Midtrans: transaction_status + fraud_status
    let status_pesanan: string | null = null;

    if (transaction_status === "settlement") {
      // Uang sudah masuk (transfer bank, VA) → Menunggu konfirmasi penjual
      status_pesanan = "menunggu_konfirmasi";
    } else if (transaction_status === "capture" && fraud_status === "accept") {
      // Kartu kredit / GoPay berhasil & tidak terdeteksi fraud → Menunggu konfirmasi penjual
      status_pesanan = "menunggu_konfirmasi";
    } else if (transaction_status === "pending") {
      // Menunggu pembayaran (VA belum ditransfer, dsb)
      status_pesanan = "menunggu_pembayaran";
    } else if (
      transaction_status === "expire" ||
      transaction_status === "expired"
    ) {
      // Waktu bayar habis
      status_pesanan = "kadaluarsa";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny"
    ) {
      // Dibatalkan atau ditolak
      status_pesanan = "dibatalkan";
    }

    // Jika status tidak dikenali, abaikan saja (tidak update DB)
    if (!status_pesanan) {
      console.log(`Status tidak ditangani: ${transaction_status}, abaikan.`);
      return NextResponse.json(
        { message: "Status diabaikan" },
        { status: 200 },
      );
    }

    // ─── 3. Update status_pesanan di Supabase ────────────────────────────────
    //        Cari pesanan berdasarkan kode_unik = order_id atau prefix order_id-
    const { error: dbError } = await supabase
      .from("pesanan")
      .update({
        status_pesanan: status_pesanan,
        metode_pembayaran: payment_type,
      })
      .or(`kode_unik.eq.${order_id},kode_unik.like.${order_id}-%`);

    if (dbError) {
      console.error("Gagal update status pesanan:", dbError.message);
      return NextResponse.json(
        { error: "Gagal update database" },
        { status: 500 },
      );
    }

    console.log(`Pesanan ${order_id} → status diupdate ke '${status_pesanan}'`);

    // ─── 4. Balas dengan 200 OK ke Midtrans ──────────────────────────────────
    //        Wajib! Jika tidak balas 200, Midtrans akan retry terus selama 24 jam
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error: any) {
    console.error("Error di webhook Midtrans:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
