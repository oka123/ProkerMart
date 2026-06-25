import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PRODUCT_SELECT = `
  id_produk, nama_produk, deskripsi, harga, stok, foto, kategori, status_aktif, tgl_dibuat, metode_jualan, preorder,
  sub_toko (
    id_sub_toko, nama_proker, jadwal_operasional,
    toko (
      id_toko, nama_toko,
      organisasi ( id_organisasi, nama_organisasi )
    )
  )
`;

const DEFAULT_PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Basic filters
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "terbaru";

  // Advanced filters
  const hargaMin = searchParams.get("harga_min");
  const hargaMax = searchParams.get("harga_max");
  const metodeParam = searchParams.get("metode") ?? ""; // comma-separated
  const inStockOnly = searchParams.get("stok") === "1";

  try {
    const supabase = await createClient();

    // ── Base query ──────────────────────────────────────────────────────────
    let query = supabase
      .from("produk")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status_aktif", true);

    // ── Category filter ─────────────────────────────────────────────────────
    if (category && category !== "Semua") {
      query = query.eq("kategori", category);
    }

    // ── Text search ─────────────────────────────────────────────────────────
    if (search.trim()) {
      query = query.ilike("nama_produk", `%${search.trim()}%`);
    }

    // ── Price range filter ──────────────────────────────────────────────────
    if (hargaMin) query = query.gte("harga", parseFloat(hargaMin));
    if (hargaMax) query = query.lte("harga", parseFloat(hargaMax));

    // ── In-stock only ────────────────────────────────────────────────────────
    if (inStockOnly) query = query.gt("stok", 0);

    // ── Metode jualan filter ────────────────────────────────────────────────
    if (metodeParam.trim()) {
      const metodeList = metodeParam
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      if (metodeList.length > 0) {
        if (metodeList.length === 1) {
          query = query.ilike("metode_jualan", `%${metodeList[0]}%`);
        } else {
          const orClauses = metodeList
            .map((m) => `metode_jualan.ilike.%${m}%`)
            .join(",");
          query = query.or(orClauses);
        }
      }
    }

    // ── Sorting ──────────────────────────────────────────────────────────────
    switch (sort) {
      case "termurah":
        query = query.order("harga", { ascending: true });
        break;
      case "termahal":
        query = query.order("harga", { ascending: false });
        break;
      case "stok":
        query = query.order("stok", { ascending: false });
        break;
      default: // "terbaru"
        query = query.order("tgl_dibuat", { ascending: false });
    }

    // ── Pagination range ─────────────────────────────────────────────────────
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("[API - Products] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count ?? 0;
    const hasMore = to < total - 1;

    return NextResponse.json({ products: data ?? [], hasMore, total, page });
  } catch (err) {
    console.error("[API - Products] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
