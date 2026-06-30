-- 1. Menambahkan kolom latitude dan longitude ke tabel sub_toko_member yang sudah ada
ALTER TABLE sub_toko_member
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Mengganti nama tabel alamat_pengguna menjadi alamat_pembeli
ALTER TABLE alamat_pengguna RENAME TO alamat_pembeli;

-- Karena nama tabel diubah, kita juga sebaiknya merevisi nama-nama policy agar tetap relevan
ALTER POLICY "Pengguna bisa melihat alamat sendiri" ON alamat_pembeli RENAME TO "Pembeli bisa melihat alamat sendiri";
ALTER POLICY "Pengguna bisa menambah alamat sendiri" ON alamat_pembeli RENAME TO "Pembeli bisa menambah alamat sendiri";
ALTER POLICY "Pengguna bisa mengubah alamat sendiri" ON alamat_pembeli RENAME TO "Pembeli bisa mengubah alamat sendiri";
ALTER POLICY "Pengguna bisa menghapus alamat sendiri" ON alamat_pembeli RENAME TO "Pembeli bisa menghapus alamat sendiri";

-- Update mock coordinates for existing members to be near jimbaran
UPDATE sub_toko_member 
SET 
  latitude = -8.795 + (random() * 0.02 - 0.01),
  longitude = 115.176 + (random() * 0.02 - 0.01)
WHERE latitude IS NULL;
