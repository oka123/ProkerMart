import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/product";

// Supabase nested select query for product with full relational data
const PRODUCT_SELECT = `
  id_produk,
  nama_produk,
  deskripsi,
  harga,
  stok,
  foto,
  kategori,
  status_aktif,
  tgl_dibuat,
  metode_jualan,
  preorder,
  sub_toko (
    id_sub_toko,
    nama_proker,
    jadwal_operasional,
    toko (
      id_toko,
      nama_toko,
      organisasi (
        id_organisasi,
        nama_organisasi
      )
    )
  )
`;

/**
 * Fetch all active products from Supabase.
 * Optionally filter by category and/or search query (server-side search on nama_produk).
 */
export async function getProducts(
  category?: string,
  search?: string
): Promise<Product[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("produk")
      .select(PRODUCT_SELECT)
      .eq("status_aktif", true)
      .order("tgl_dibuat", { ascending: false });

    if (category && category !== "Semua") {
      query = query.eq("kategori", category);
    }

    if (search && search.trim() !== "") {
      query = query.ilike("nama_produk", `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Products - getProducts] Error:", error);
      return [];
    }

    return (data as unknown as Product[]) ?? [];
  } catch (err) {
    console.error("[Products - getProducts] Unexpected error:", err);
    return [];
  }
}

/**
 * Fetch a single product by its ID.
 * Returns null if not found or if an error occurs.
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("produk")
      .select(PRODUCT_SELECT)
      .eq("id_produk", id)
      .eq("status_aktif", true)
      .single();

    if (error) {
      console.error("[Products - getProductById] Error:", error);
      return null;
    }

    return (data as unknown as Product) ?? null;
  } catch (err) {
    console.error("[Products - getProductById] Unexpected error:", err);
    return null;
  }
}
