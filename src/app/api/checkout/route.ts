/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import midtransClient from "midtrans-client";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

async function bersihkanKeranjangJikaPerlu(
  supabase: any,
  jalur_checkout: string,
  idUserAsli: string,
  items: any[],
) {
  if (jalur_checkout !== "keranjang") return;

  try {
    const daftarIdProduk =
      items?.map((item: any) => item.produk?.id_produk) ?? [];
    if (daftarIdProduk.length > 0) {
      const { error: deleteCartError } = await supabase
        .from("keranjang")
        .delete()
        .eq("id_pengguna", idUserAsli)
        .in("id_produk", daftarIdProduk);

      if (deleteCartError) {
        console.error("Gagal menghapus keranjang:", deleteCartError.message);
      } else {
        console.log("Keranjang berhasil dibersihkan untuk user:", idUserAsli);
      }
    }
  } catch (cartError) {
    console.error("Terjadi kesalahan saat membersihkan keranjang:", cartError);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const body = await request.json();
    console.log("Struktur item[0]:", JSON.stringify(body.items?.[0], null, 2));
    const {
      nama_kustomer,
      email_kustomer,
      items,
      metode_pembayaran,
      jalur_checkout,
      alamat_pengambilan,
      id_voucher,
    } = body;

    const authResponse = await supabase.auth.getUser();
    const idUserAsli = authResponse.data.user?.id;

    if (!idUserAsli) {
      return NextResponse.json(
        { error: "Sesi login tidak ditemukan. Silakan login ulang." },
        { status: 401 },
      );
    }
    // ─── 1. Group items by sub_toko ──────────
    const groups: { [key: string]: any[] } = {};
    for (const item of items) {
      const subTokoId =
        item.produk?.sub_toko?.id_sub_toko ??
        item.produk?.id_sub_toko ??
        item.id_sub_toko;
      if (!subTokoId) {
        return NextResponse.json(
          {
            error:
              "Gagal membuat pesanan: Data toko tidak ditemukan pada item ini.",
          },
          { status: 400 },
        );
      }
      if (!groups[subTokoId]) {
        groups[subTokoId] = [];
      }
      groups[subTokoId].push(item);
    }

    const orderGroups = Object.keys(groups);
    const order_id_base = `PM${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const insertedOrderIds: string[] = [];

    // ─── Voucher & platform fees calculations ───
    const serverSubtotal = items.reduce(
      (acc: number, item: any) =>
        acc + Number(item.produk?.harga ?? item.harga ?? 0) * item.jumlah,
      0,
    );

    let discountAmount = 0;
    let voucherData = null;

    if (id_voucher) {
      const { data: v, error: vErr } = await supabase
        .from("voucher")
        .select("*")
        .eq("id_voucher", id_voucher)
        .single();

      if (vErr || !v) {
        console.error("Voucher tidak ditemukan:", id_voucher);
        return NextResponse.json(
          { error: "Voucher tidak ditemukan." },
          { status: 400 },
        );
      }

      if (!v.status) {
        return NextResponse.json(
          { error: "Voucher tidak aktif." },
          { status: 400 },
        );
      }

      if (new Date(v.tgl_berakhir) < new Date()) {
        return NextResponse.json(
          { error: "Voucher sudah kedaluwarsa." },
          { status: 400 },
        );
      }

      if (v.kuota !== null && v.kuota <= 0) {
        return NextResponse.json(
          { error: "Kuota voucher sudah habis." },
          { status: 400 },
        );
      }

      const { data: vPengguna, error: vpErr } = await supabase
        .from("voucher_pengguna")
        .select("*")
        .eq("id_pengguna", idUserAsli)
        .eq("id_voucher", id_voucher)
        .single();

      if (vpErr || !vPengguna) {
        return NextResponse.json(
          { error: "Anda belum mengklaim voucher ini." },
          { status: 400 },
        );
      }

      if (vPengguna.status_pakai) {
        return NextResponse.json(
          { error: "Voucher ini sudah Anda gunakan." },
          { status: 400 },
        );
      }

      if (v.min_belanja && serverSubtotal < Number(v.min_belanja)) {
        return NextResponse.json(
          {
            error: `Minimal belanja Rp ${Number(v.min_belanja).toLocaleString("id-ID")} belum terpenuhi.`,
          },
          { status: 400 },
        );
      }

      if (v.tipe_diskon === "persen") {
        discountAmount = (serverSubtotal * Number(v.nilai_diskon)) / 100;
        if (v.max_diskon && discountAmount > Number(v.max_diskon)) {
          discountAmount = Number(v.max_diskon);
        }
      } else if (v.tipe_diskon === "nominal") {
        discountAmount = Number(v.nilai_diskon);
      }

      if (discountAmount > serverSubtotal) {
        discountAmount = serverSubtotal;
      }

      voucherData = v;
    }

    const platformFee = 2000;
    const serverCalculatedTotal = Math.max(
      0,
      serverSubtotal + platformFee - discountAmount,
    );

    // ─── Loop to insert split orders ───
    for (let index = 0; index < orderGroups.length; index++) {
      const subTokoId = orderGroups[index];
      const groupItems = groups[subTokoId];

      const groupSubtotal = groupItems.reduce(
        (acc: number, item: any) =>
          acc + Number(item.produk?.harga ?? item.harga ?? 0) * item.jumlah,
        0,
      );

      // Apply platformFee and discountAmount only to the first order to match combined transaction total
      const currentPlatformFee = index === 0 ? platformFee : 0;
      const currentDiscountAmount = index === 0 ? discountAmount : 0;
      const groupTotal = Math.max(
        0,
        groupSubtotal + currentPlatformFee - currentDiscountAmount,
      );

      const groupOrderKode = `${order_id_base}-${index + 1}`;

      const { data: insertedOrder, error: dbError } = await supabase
        .from("pesanan")
        .insert({
          kode_unik: groupOrderKode,
          total_harga: Math.round(groupTotal),
          metode_pembayaran: metode_pembayaran,
          status_pesanan:
            metode_pembayaran === "cod"
              ? "menunggu_konfirmasi"
              : "menunggu_pembayaran",
          tgl_pesan: new Date().toISOString(),
          id_sub_toko: subTokoId,
          id_pengguna: idUserAsli,
          alamat_pengambilan: alamat_pengambilan || null,
        })
        .select("id_pesanan")
        .single();

      if (dbError) {
        console.error(
          `Gagal simpan pesanan ${groupOrderKode} ke DB:`,
          dbError.message,
        );
        return NextResponse.json(
          { error: "Gagal membuat pesanan", detail: dbError.message },
          { status: 500 },
        );
      }

      insertedOrderIds.push(insertedOrder.id_pesanan);

      const detailInserts = groupItems.map((item: any) => ({
        id_pesanan: insertedOrder.id_pesanan,
        id_produk: item.produk?.id_produk ?? item.id_produk,
        jumlah: Number(item.jumlah),
        harga_satuan: Number(item.produk?.harga ?? item.harga),
        sub_total:
          Number(item.jumlah) * Number(item.produk?.harga ?? item.harga),
        metode_pengambilan: item.metode_pengambilan || "pickup",
        tgl_ambil: item.tgl_ambil || null,
      }));

      const { error: detailError } = await supabase
        .from("detail_pesanan")
        .insert(detailInserts);

      if (detailError) {
        console.error(
          "Gagal simpan detail pesanan ke DB:",
          detailError.message,
        );
        return NextResponse.json(
          {
            error: "Gagal menyimpan item pesanan",
            detail: detailError.message,
          },
          { status: 500 },
        );
      }

      // ─── Atomic stock decrement (race-condition safe via FOR UPDATE lock) ───
      for (const item of groupItems) {
        const productId = item.produk?.id_produk ?? item.id_produk;
        const quantity = Number(item.jumlah);

        const { data: decremented, error: stockError } = await supabase.rpc(
          "decrement_stock",
          { p_id_produk: productId, p_jumlah: quantity },
        );

        if (stockError) {
          console.error(
            `[Checkout] Gagal update stok produk ${productId}:`,
            stockError.message,
          );
          return NextResponse.json(
            { error: "Gagal memperbarui stok produk. Silakan coba lagi." },
            { status: 500 },
          );
        }

        if (!decremented) {
          // Stock insufficient (race condition: another buyer grabbed the last stock)
          console.warn(`[Checkout] Stok tidak cukup untuk produk ${productId}`);
          // Rollback: cancel the orders we already inserted
          await supabase
            .from("pesanan")
            .update({ status_pesanan: "dibatalkan" })
            .in("id_pesanan", insertedOrderIds);
          return NextResponse.json(
            {
              error: `Stok produk tidak mencukupi. Silakan perbarui keranjang Anda.`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Update voucher usage in database if voucher is applied
    if (id_voucher) {
      const { error: updateVpErr } = await supabase
        .from("voucher_pengguna")
        .update({
          status_pakai: true,
          tgl_pakai: new Date().toISOString(),
        })
        .eq("id_pengguna", idUserAsli)
        .eq("id_voucher", id_voucher);

      if (updateVpErr) {
        console.error(
          "Gagal update status voucher_pengguna:",
          updateVpErr.message,
        );
      }

      if (voucherData && voucherData.kuota !== null) {
        const { error: updateQuotaErr } = await supabase
          .from("voucher")
          .update({ kuota: voucherData.kuota - 1 })
          .eq("id_voucher", id_voucher);

        if (updateQuotaErr) {
          console.error("Gagal update kuota voucher:", updateQuotaErr.message);
        }
      }
    }

    // Cleanup Cart
    await bersihkanKeranjangJikaPerlu(
      supabase,
      jalur_checkout,
      idUserAsli,
      items,
    );

    if (metode_pembayaran === "cod") {
      return NextResponse.json({
        success: true,
        isCod: true,
        message: "Pesanan COD berhasil dibuat!",
      });
    }

    // Midtrans Snap Token Creation
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });

    const item_details =
      items?.map((item: any) => ({
        id: item.produk?.id_produk ?? "ITEM",
        price: Math.round(Number(item.produk?.harga)),
        quantity: Number(item.jumlah),
        name: item.produk?.nama_produk?.substring(0, 50) ?? "Produk",
      })) ?? [];

    // Tambah platform fee
    item_details.push({
      id: "BIAYA-LAYANAN",
      price: platformFee,
      quantity: 1,
      name: "Biaya Layanan",
    });

    // Tambah diskon voucher jika ada
    if (discountAmount > 0) {
      item_details.push({
        id: "DISKON-VOUCHER",
        price: -discountAmount,
        quantity: 1,
        name: `Diskon Voucher: ${voucherData?.kode_voucher ?? "Promo"}`,
      });
    }

    const gross_amount = Math.round(serverCalculatedTotal);

    let enabled_payments: string[] = [];
    if (metode_pembayaran === "qris") {
      enabled_payments = ["gopay", "shopeepay", "ovo", "other_qris"];
    } else if (metode_pembayaran === "transfer") {
      enabled_payments = [
        "bca_va",
        "bni_va",
        "bri_va",
        "mandiri_va",
        "permata_va",
      ];
    }

    const origin = new URL(request.url).origin;

    const parameter: any = {
      transaction_details: {
        order_id: order_id_base,
        gross_amount: gross_amount,
      },
      customer_details: {
        first_name: nama_kustomer || "Pembeli",
        email: email_kustomer || "pembeli@prokermart.com",
      },
      item_details: item_details,
      callbacks: {
        finish: `${origin}/user/purchase`,
        error: `${origin}/checkout`,
        pending: `${origin}/user/purchase`,
      },
    };

    if (enabled_payments.length > 0) {
      parameter.enabled_payments = enabled_payments;
    }

    const transaction = await snap.createTransaction(parameter);

    // Update snap_token in database for all split orders
    const { error: updateTokenError } = await supabase
      .from("pesanan")
      .update({ snap_token: transaction.token })
      .in("id_pesanan", insertedOrderIds);

    if (updateTokenError) {
      console.error("Gagal update snap_token:", updateTokenError);
    }

    return NextResponse.json({ token: transaction.token });
  } catch (error: any) {
    console.error("Error di API checkout:", error.message);
    console.error("GAGAL DARI SDK MIDTRANS:", error.message);
    return NextResponse.json(
      { error: "Gagal memproses pembayaran", detail: error.message },
      { status: 500 },
    );
  }
}
