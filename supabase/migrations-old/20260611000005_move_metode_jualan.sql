-- Menghapus kolom metode_jualan dari tabel sub_toko
ALTER TABLE sub_toko DROP COLUMN IF EXISTS metode_jualan;

-- Menambahkan kolom metode_jualan ke tabel produk dengan nilai default 'pickup,delivery'
ALTER TABLE produk ADD COLUMN IF NOT EXISTS metode_jualan VARCHAR(255) DEFAULT 'pickup,delivery';
