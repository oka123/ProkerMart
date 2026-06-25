/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const search = searchParams.get("search") ?? "";
  const radius = parseFloat(searchParams.get("radius") ?? "10"); // default 10km

  if (!latParam || !lngParam) {
    return NextResponse.json(
      { error: "Latitude dan longitude diperlukan" },
      { status: 400 },
    );
  }

  const userLat = parseFloat(latParam);
  const userLng = parseFloat(lngParam);

  try {
    const supabase = createAdminClient();

    // 1. Dapatkan daftar id_sub_toko dan jaraknya menggunakan RPC
    const { data: nearbyData, error: rpcError } = await supabase.rpc(
      "get_nearby_sub_toko",
      {
        user_lat: userLat,
        user_lon: userLng,
        max_distance_km: radius,
      },
    );

    if (rpcError) {
      console.error("[API - Nearby] RPC Error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!nearbyData || nearbyData.length === 0) {
      return NextResponse.json({ shops: [] });
    }

    // 2. Ambil detail sub_toko, toko, dan produk
    const ids = nearbyData.map((n: { id_sub_toko: string }) => n.id_sub_toko);

    let query = supabase
      .from("sub_toko")
      .select(
        `
        id_sub_toko,
        nama_proker,
        foto_sampul,
        latitude,
        longitude,
        toko (
          id_toko,
          nama_toko,
          latitude,
          longitude
        ),
        sub_toko_member (
          id_pengguna,
          latitude,
          longitude,
          pengguna (
            nama
          )
        ),
        produk (
          kategori
        ),
        ulasan (
          rating
        )
      `,
      )
      .in("id_sub_toko", ids);

    // Filter pencarian
    if (search.trim()) {
      // Supabase tidak mendukug OR lintas tabel di PostgREST dengan mudah,
      // kita filter dari nama_proker.
      query = query.ilike("nama_proker", `%${search.trim()}%`);
    }

    const { data: shopsData, error: shopsError } = await query;

    if (shopsError) {
      console.error("[API - Nearby] Fetch Shops Error:", shopsError);
      return NextResponse.json({ error: shopsError.message }, { status: 500 });
    }

    // 3. Gabungkan data jarak dengan data toko dan format sesuai UI
    const formattedShops = (shopsData || [])

      .map((shop: any) => {
        // Cari jarak dari data RPC
        const distanceInfo = nearbyData.find(
          (n: any) => n.id_sub_toko === shop.id_sub_toko,
        );
        const distanceKm = distanceInfo ? distanceInfo.distance_km : 0;

        // Ambil kategori unik dari produk
        const categories = Array.from(
          new Set(
            (shop.produk || []).map((p: any) => p.kategori).filter(Boolean),
          ),
        ).join(", ");

        // Gabungkan nama toko dan proker
        const tokoData = Array.isArray(shop.toko) ? shop.toko[0] : shop.toko;
        const namaToko = tokoData?.nama_toko || "Toko";
        const fullName = `${namaToko} - ${shop.nama_proker}`;

        // Jika pencarian text dipakai, bisa di-filter lagi di JS agar lebih akurat mencari nama_toko juga
        if (
          search.trim() &&
          !fullName.toLowerCase().includes(search.toLowerCase())
        ) {
          return null; // Akan dibuang di tahap filter
        }

        const members = shop.sub_toko_member || [];

        const panitiaList = members
          .map((m: any) => {
            const penggunaObj = Array.isArray(m.pengguna)
              ? m.pengguna[0]
              : m.pengguna;
            return {
              id: m.id_pengguna,
              name: penggunaObj?.nama || "Panitia",
              lat: m.latitude,
              lng: m.longitude,
            };
          })
          .filter((m: any) => m.lat && m.lng);

        // Hitung rating berdasarkan data ulasan
        const ulasanList = shop.ulasan || [];
        const reviewCount = ulasanList.length;
        const rating =
          reviewCount > 0
            ? ulasanList.reduce((sum: number, u: any) => sum + u.rating, 0) /
              reviewCount
            : 0;

        return {
          id: shop.id_sub_toko,
          name: fullName,
          tokoName: namaToko,
          tokoId: tokoData?.id_toko,
          categories: categories || "Lainnya",
          rating: Number(rating.toFixed(1)),
          reviewCount: reviewCount,
          distanceKm: parseFloat(distanceKm.toFixed(1)),
          travelTimeMin: Math.round(distanceKm * 15) || 5, // Estimasi 15 menit per km
          imageUrl: shop.foto_sampul || "/placeholder.jpg",
          lat: shop.latitude,
          lng: shop.longitude,
          tokoCoords:
            tokoData?.latitude && tokoData?.longitude
              ? { lat: tokoData.latitude, lng: tokoData.longitude }
              : null,
          panitiaList: panitiaList,
          promoTag: undefined, // Dihapus karena menggunakan dummy
        };
      })
      .filter(Boolean)

      .sort((a: any, b: any) => a.distanceKm - b.distanceKm); // Urutkan berdasarkan jarak

    return NextResponse.json({ shops: formattedShops });
  } catch (err) {
    console.error("[API - Nearby] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
