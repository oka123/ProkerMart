// Type definitions for Product data fetched from Supabase with relational joins

export interface SubTokoInfo {
  id_sub_toko: string;
  nama_proker: string;
  jadwal_operasional: string | null;
  toko: {
    id_toko: string;
    nama_toko: string;
    organisasi: {
      id_organisasi: string;
      nama_organisasi: string;
    };
  };
}

export interface Product {
  id_produk: string;
  nama_produk: string;
  deskripsi: string | null;
  harga: number;
  stok: number;
  foto: string | null;
  kategori: string | null;
  status_aktif: boolean;
  tgl_dibuat: string;
  metode_jualan: string | null;
  preorder: boolean;
  sub_toko: SubTokoInfo;
}

export type Category =
  | "Semua"
  | "Makanan"
  | "Minuman"
  | "Pakaian"
  | "Merchandise"
  | "Jasa"
  | "Lainnya";

export const CATEGORIES: Category[] = [
  "Semua",
  "Makanan",
  "Minuman",
  "Pakaian",
  "Merchandise",
  "Jasa",
  "Lainnya",
];
