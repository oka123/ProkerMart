import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function midtransRequest(path: string, body?: object) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const res = await fetch(`https://api.sandbox.midtrans.com/v2${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function POST(request: Request) {
  try {
    const { id_pesanan, alasan } = await request.json();

    if (!id_pesanan || !alasan?.trim()) {
      return NextResponse.json({ error: "id_pesanan dan alasan wajib diisi." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: pesanan, error: fetchError } = await admin
      .from("pesanan")
      .select("id_pesanan, kode_unik, id_sub_toko, id_pengguna, status_pesanan, total_harga, detail_pesanan(id_produk, jumlah)")
      .eq("id_pesanan", id_pesanan)
      .single();

    if (fetchError || !pesanan) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

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

    const cancellableStatuses = ["menunggu_konfirmasi", "diproses"];
    if (!cancellableStatuses.includes(pesanan.status_pesanan)) {
      return NextResponse.json({ error: "Pesanan tidak dapat dibatalkan pada status ini." }, { status: 400 });
    }

    const { data: pembayaran } = await admin
      .from("pembayaran")
      .select("metode_pembayaran, status_bayar")
      .eq("id_pesanan", id_pesanan)
      .maybeSingle();

    const metode = pembayaran?.metode_pembayaran ?? "tunai";
    const statusBayar = pembayaran?.status_bayar ?? "menunggu";

    let statusRefund: string = "tidak_perlu";
    let refundMsg = "";

    if (metode === "tunai") {
      statusRefund = "tidak_perlu";
      refundMsg = "Tidak ada refund untuk pembayaran tunai.";
    } else if (metode === "transfer") {
      statusRefund = "diproses";
      refundMsg = "Refund akan diproses secara manual oleh admin. Hubungi admin untuk informasi lebih lanjut.";
    } else if (metode === "qris") {
      try {
        let midtransResult;
        if (statusBayar === "menunggu") {
          midtransResult = await midtransRequest(`/${pesanan.kode_unik}/cancel`);
        } else {
          const timestamp = Date.now();
          midtransResult = await midtransRequest(`/${pesanan.kode_unik}/refund`, {
            refund_key: `refund-${pesanan.kode_unik}-${timestamp}`,
            amount: pesanan.total_harga,
            reason: "Dibatalkan oleh penjual",
          });
        }
        const midtransStatus = midtransResult?.status_code;
        if (midtransStatus === "200" || midtransStatus === 200) {
          statusRefund = "selesai";
          refundMsg = "Refund QRIS berhasil diproses.";
        } else {
          statusRefund = "gagal";
          refundMsg = "Refund QRIS gagal diproses. Hubungi admin untuk bantuan.";
          console.error("[cancel-by-seller - Midtrans] Refund gagal:", midtransResult);
        }
      } catch (err) {
        statusRefund = "gagal";
        refundMsg = "Refund QRIS gagal diproses. Hubungi admin untuk bantuan.";
        console.error("[cancel-by-seller - Midtrans] Error:", err);
      }
    }

    const { error: cancelError } = await admin
      .from("pesanan")
      .update({
        status_pesanan: "dibatalkan",
        alasan_batal: alasan.trim(),
        dibatalkan_oleh: "penjual",
        status_refund: statusRefund,
      })
      .eq("id_pesanan", id_pesanan);

    if (cancelError) {
      console.error("[cancel-by-seller - Update] Error:", cancelError);
      return NextResponse.json({ error: "Gagal membatalkan pesanan." }, { status: 500 });
    }

    for (const detail of (pesanan as any).detail_pesanan ?? []) {
      const { error: stockErr } = await admin.rpc("increment_stock", {
        p_id_produk: detail.id_produk,
        p_jumlah: detail.jumlah,
      });
      if (stockErr) {
        console.error(`[cancel-by-seller - Stock] Gagal kembalikan stok ${detail.id_produk}:`, stockErr.message);
      }
    }

    const notifIsi = `Pesanan #${pesanan.kode_unik} dibatalkan oleh penjual. Alasan: ${alasan.trim()}. ${refundMsg}`;
    const { error: notifError } = await admin
      .from("notifikasi")
      .insert({
        id_pengguna: pesanan.id_pengguna,
        judul: "Pesanan Dibatalkan",
        konten: notifIsi,
        link_terkait: `/dashboard/orders`,
        status_dibaca: false,
      });

    if (notifError) {
      console.error("[cancel-by-seller - Notifikasi] Error:", notifError);
    }

    return NextResponse.json({ ok: true, status_refund: statusRefund, metode_pembayaran: metode });
  } catch (err) {
    console.error("[cancel-by-seller] Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
