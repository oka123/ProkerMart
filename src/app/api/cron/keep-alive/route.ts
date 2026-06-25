/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    // Melakukan query ringan ke database untuk menjaga koneksi aktif
    // dan mencegah project Supabase ter-pause (mati) karena inaktivitas
    const { error } = await supabase
      .from("produk")
      .select("id_produk")
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Ping berhasil! Project Supabase tetap aktif.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Cron - Keep Alive] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
