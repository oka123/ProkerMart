-- Buat bucket penyimpanan (storage) bernama 'foto_produk'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('foto_produk', 'foto_produk', true)
ON CONFLICT (id) DO NOTHING;

-- RLS untuk tabel storage.objects agar aman
CREATE POLICY "Foto produk bisa dilihat semua orang"
ON storage.objects FOR SELECT
USING (bucket_id = 'foto_produk');

CREATE POLICY "Pengguna dapat mengunggah foto produk"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'foto_produk');

CREATE POLICY "Pengguna dapat mengubah foto produk"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'foto_produk');

CREATE POLICY "Pengguna dapat menghapus foto produk"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'foto_produk');
