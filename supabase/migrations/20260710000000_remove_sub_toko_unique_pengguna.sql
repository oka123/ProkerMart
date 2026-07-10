-- Migration: Remove unique constraint on sub_toko.id_pengguna
-- Reason: An org leader (ketua organisasi) needs to be able to create multiple
-- sub_toko (proker) under their organization. The 1:1 constraint between
-- id_pengguna and sub_toko prevents this and causes error 23505 on the 2nd proker.

ALTER TABLE sub_toko DROP CONSTRAINT IF EXISTS sub_toko_id_pengguna_key;

-- Keep the index for performance but remove the uniqueness requirement
-- Note: The id_pengguna column is still kept (references who created the sub_toko)
-- but is no longer unique across the whole table.
