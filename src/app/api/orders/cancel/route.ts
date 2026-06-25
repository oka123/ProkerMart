/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/orders/cancel
 * Cancels all orders associated with a kode_unik (base or split) and
 * atomically restores product stock via the increment_stock DB function.
 * Body: { kode_unik: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const { kode_unik } = await request.json();

    if (!kode_unik) {
      return NextResponse.json({ error: "kode_unik tidak boleh kosong." }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    // Fetch all sibling split orders + their items
    const { data: pesananList, error: fetchError } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan,
        kode_unik,
        status_pesanan,
        detail_pesanan ( id_produk, jumlah )
      `)
      .or(`kode_unik.eq.${kode_unik},kode_unik.like.${kode_unik}-%`)
      .eq("id_pengguna", user.id);

    if (fetchError || !pesananList || pesananList.length === 0) {
      console.error("[Orders/Cancel] Pesanan tidak ditemukan:", fetchError);
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Only allow cancellation of unpaid / pending-confirmation orders
    const nonCancellable = pesananList.filter(
      (p: any) => p.status_pesanan !== "menunggu_pembayaran" && p.status_pesanan !== "menunggu_konfirmasi"
    );
    if (nonCancellable.length > 0) {
      return NextResponse.json({ error: "Pesanan tidak dapat dibatalkan karena sudah diproses." }, { status: 400 });
    }

    // Cancel all sibling orders
    const { error: cancelError } = await supabase
      .from("pesanan")
      .update({ status_pesanan: "dibatalkan" })
      .or(`kode_unik.eq.${kode_unik},kode_unik.like.${kode_unik}-%`)
      .eq("id_pengguna", user.id);

    if (cancelError) {
      console.error("[Orders/Cancel] Gagal membatalkan pesanan:", cancelError);
      throw cancelError;
    }

    // Atomically restore stock for every item in every sibling order
    for (const pesanan of pesananList) {
      for (const detail of (pesanan as any).detail_pesanan) {
        const { error: restoreError } = await supabase.rpc("increment_stock", {
          p_id_produk: detail.id_produk,
          p_jumlah: detail.jumlah,
        });
        if (restoreError) {
          console.error(`[Orders/Cancel] Gagal mengembalikan stok ${detail.id_produk}:`, restoreError.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Pesanan berhasil dibatalkan." });
  } catch (error: any) {
    console.error("[Orders/Cancel] Unexpected error:", error.message);
    return NextResponse.json({ error: "Terjadi kesalahan saat membatalkan pesanan." }, { status: 500 });
  }
}
