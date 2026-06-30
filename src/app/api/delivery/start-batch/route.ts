import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ProkerMart/1.0 (student-org-marketplace)" },
    });
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const { orders, lat, lng, pengantar_id } = await request.json();
    // orders: Array<{ id_pesanan: string; alamat_pengambilan: string }>

    if (!orders?.length || !pengantar_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Geocode each address (with 1s delay between calls to respect Nominatim rate limit)
    const withCoords: Array<{ id_pesanan: string; alamat: string; lat: number; lng: number; dist: number }> = [];
    const noCoords: Array<{ id_pesanan: string; alamat: string }> = [];

    for (const order of orders) {
      const coords = await geocode(order.alamat_pengambilan);
      if (coords && lat && lng) {
        withCoords.push({
          id_pesanan: order.id_pesanan,
          alamat: order.alamat_pengambilan,
          lat: coords.lat,
          lng: coords.lng,
          dist: haversine(lat, lng, coords.lat, coords.lng),
        });
      } else {
        noCoords.push({ id_pesanan: order.id_pesanan, alamat: order.alamat_pengambilan });
      }
      // Nominatim rate limit
      await new Promise(r => setTimeout(r, 1100));
    }

    // Sort by distance (nearest first), append ungeocodable at end
    withCoords.sort((a, b) => a.dist - b.dist);
    const sorted = [...withCoords, ...noCoords.map(o => ({ ...o, lat: 0, lng: 0, dist: 999 }))];

    const id_ronde = uuidv4();

    // Bulk update all orders
    for (let i = 0; i < sorted.length; i++) {
      const { error } = await supabase
        .from("pesanan")
        .update({
          status_pesanan: "dikirim",
          pengantar_id,
          id_ronde,
          urutan_antar: i + 1,
          is_tujuan_aktif: i === 0,
        })
        .eq("id_pesanan", sorted[i].id_pesanan);

      if (error) {
        console.error(`[start-batch] Gagal update pesanan ${sorted[i].id_pesanan}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      id_ronde,
      sorted: sorted.map((o, i) => ({ id_pesanan: o.id_pesanan, urutan: i + 1, dist_km: o.dist?.toFixed(2) })),
    });
  } catch (err: any) {
    console.error("[start-batch] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
