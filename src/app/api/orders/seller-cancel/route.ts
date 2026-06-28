import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/orders/seller-cancel
 * Seller rejects or cancels an order. Restores stock.
 * Body: { id_pesanan: string, alasan_batal?: string }
 */
export async function POST(request: Request) {
  try {
    const { id_pesanan, alasan_batal } = await request.json();

    if (!id_pesanan) {
      return NextResponse.json({ error: "id_pesanan wajib diisi." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch the order with items
    const { data: pesanan, error: fetchError } = await admin
      .from("pesanan")
      .select("id_pesanan, id_sub_toko, status_pesanan, detail_pesanan(id_produk, jumlah)")
      .eq("id_pesanan", id_pesanan)
      .single();

    if (fetchError || !pesanan) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Verify caller is an active member of this sub_toko
    const { data: membership } = await admin
      .from("sub_toko_member")
      .select("id_member")
      .eq("id_sub_toko", pesanan.id_sub_toko)
      .eq("id_pengguna", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Anda bukan anggota aktif sub toko ini." }, { status: 403 });
    }

    const cancellableStatuses = ["menunggu_konfirmasi", "diproses", "menunggu_produksi"];
    if (!cancellableStatuses.includes(pesanan.status_pesanan)) {
      return NextResponse.json({ error: "Pesanan tidak dapat dibatalkan pada status ini." }, { status: 400 });
    }

    // Cancel order
    const { error: cancelError } = await admin
      .from("pesanan")
      .update({
        status_pesanan: "dibatalkan",
        alasan_batal: alasan_batal ?? null,
      })
      .eq("id_pesanan", id_pesanan);

    if (cancelError) {
      console.error("[seller-cancel] Gagal membatalkan:", cancelError);
      throw cancelError;
    }

    // Restore stock
    for (const detail of (pesanan as any).detail_pesanan ?? []) {
      const { error: stockErr } = await admin.rpc("increment_stock", {
        p_id_produk: detail.id_produk,
        p_jumlah: detail.jumlah,
      });
      if (stockErr) {
        console.error(`[seller-cancel] Gagal kembalikan stok ${detail.id_produk}:`, stockErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[seller-cancel] Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
