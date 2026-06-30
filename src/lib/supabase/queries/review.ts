/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";

export interface ReviewWithUser {
  id_ulasan: string;
  rating: number;
  komentar: string | null;
  tgl_ulasan: string;
  pengguna: {
    nama: string;
  };
}

/**
 * Fetch all reviews (ulasan) for a given sub-store (sub_toko) from Supabase.
 * Returns an empty array if none found or if an error occurs.
 */
export async function getReviewsBySubToko(
  subTokoId: string
): Promise<ReviewWithUser[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ulasan")
      .select(`
        id_ulasan,
        rating,
        komentar,
        tgl_ulasan,
        pengguna (
          nama
        )
      `)
      .eq("id_sub_toko", subTokoId)
      .order("tgl_ulasan", { ascending: false });

    if (error) {
      console.error("[Review - getReviewsBySubToko] Error:", error);
      return [];
    }

    return (data as any) ?? [];
  } catch (err) {
    console.error("[Review - getReviewsBySubToko] Unexpected error:", err);
    return [];
  }
}
