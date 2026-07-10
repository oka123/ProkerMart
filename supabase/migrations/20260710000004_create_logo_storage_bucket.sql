-- Buat bucket penyimpanan (storage) bernama 'logo_organisasi'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logo_organisasi', 'logo_organisasi', true)
ON CONFLICT (id) DO NOTHING;

-- RLS untuk tabel storage.objects agar aman
CREATE POLICY "Public Access for Logo Organisasi"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logo_organisasi' );

CREATE POLICY "Authenticated users can upload Logo Organisasi"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'logo_organisasi' );

CREATE POLICY "Users can update their own Logo Organisasi"
ON storage.objects FOR UPDATE TO authenticated
WITH CHECK ( bucket_id = 'logo_organisasi' );

CREATE POLICY "Users can delete their own Logo Organisasi"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'logo_organisasi' );
