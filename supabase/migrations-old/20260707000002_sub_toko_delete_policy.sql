-- Migration: Add DELETE RLS policies for sub_toko
-- This allows proker owners and organisasi members to delete a sub_toko (proker)

-- 1. Allow proker owner to delete their own sub_toko
CREATE POLICY "sub_toko: proker owner can delete"
  ON public.sub_toko FOR DELETE
  USING (auth.uid() = id_pengguna);

-- 2. Allow organisasi owner to delete any sub_toko under their toko
CREATE POLICY "sub_toko: organisasi owner can delete"
  ON public.sub_toko FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.toko t
      JOIN public.organisasi o ON t.id_organisasi = o.id_organisasi
      WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
    )
  );

-- 3. Allow organisasi members to delete any sub_toko under their organization
CREATE POLICY "sub_toko: organisasi members can delete"
  ON public.sub_toko FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.toko t
      JOIN public.organisasi_member om ON t.id_organisasi = om.id_organisasi
      WHERE t.id_toko = sub_toko.id_toko AND om.id_pengguna = auth.uid()
    )
  );
