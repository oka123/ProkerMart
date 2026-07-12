-- Buat bucket penyimpanan (storage) bernama 'profil_pengguna'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profil_pengguna', 'profil_pengguna', true)
ON CONFLICT (id) DO NOTHING;

-- RLS untuk tabel storage.objects agar aman
-- 1. Siapa saja dapat melihat (Select) foto profil karena public
CREATE POLICY "Foto profil bisa dilihat semua orang"
ON storage.objects FOR SELECT
USING (bucket_id = 'profil_pengguna');

-- 2. Pengguna yang sudah login dapat mengunggah (Insert) foto
CREATE POLICY "Pengguna dapat mengunggah foto profil"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profil_pengguna');

-- 3. Pengguna dapat memperbarui (Update) fotonya sendiri
CREATE POLICY "Pengguna dapat mengubah fotonya sendiri"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profil_pengguna');

-- 4. Pengguna dapat menghapus (Delete) fotonya sendiri
CREATE POLICY "Pengguna dapat menghapus fotonya sendiri"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profil_pengguna');
