-- Policy for sub_toko UPDATE
DROP POLICY IF EXISTS "sub_toko: org owner can update" ON public.sub_toko;
CREATE POLICY "sub_toko: org owner can update"
  ON public.sub_toko FOR UPDATE
  USING (
    id_pengguna = auth.uid() OR
    EXISTS (
      SELECT 1 FROM toko t
      JOIN organisasi o ON t.id_organisasi = o.id_organisasi
      WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
    )
  );

-- Policy for sub_toko DELETE (just in case they need to delete)
DROP POLICY IF EXISTS "sub_toko: org owner can delete" ON public.sub_toko;
CREATE POLICY "sub_toko: org owner can delete"
  ON public.sub_toko FOR DELETE
  USING (
    id_pengguna = auth.uid() OR
    EXISTS (
      SELECT 1 FROM toko t
      JOIN organisasi o ON t.id_organisasi = o.id_organisasi
      WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
    )
  );
