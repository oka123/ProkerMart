-- Tambahkan kolom snap_token ke tabel pesanan untuk menyimpan token pembayaran midtrans
ALTER TABLE pesanan ADD COLUMN IF NOT EXISTS snap_token VARCHAR(255);
