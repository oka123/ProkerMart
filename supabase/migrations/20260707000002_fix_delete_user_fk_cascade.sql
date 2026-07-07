-- Alter pesanan table foreign key constraint
ALTER TABLE public.pesanan
DROP CONSTRAINT IF EXISTS pesanan_id_pengguna_fkey,
ADD CONSTRAINT pesanan_id_pengguna_fkey
  FOREIGN KEY (id_pengguna)
  REFERENCES public.pengguna(id_pengguna)
  ON DELETE CASCADE;

-- Alter sub_toko table foreign key constraint
ALTER TABLE public.sub_toko
DROP CONSTRAINT IF EXISTS sub_toko_id_pengguna_fkey,
ADD CONSTRAINT sub_toko_id_pengguna_fkey
  FOREIGN KEY (id_pengguna)
  REFERENCES public.pengguna(id_pengguna)
  ON DELETE CASCADE;
