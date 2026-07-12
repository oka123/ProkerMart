-- Menambahkan kolom latitude dan longitude ke alamat_pengguna
ALTER TABLE alamat_pengguna 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
