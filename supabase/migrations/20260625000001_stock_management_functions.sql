-- Migration: Atomic stock management functions
-- Uses FOR UPDATE row locking to prevent race conditions
-- when multiple buyers checkout the same product simultaneously.

-- 1. Decrement stock atomically
-- Returns TRUE if successful, FALSE if insufficient stock or product not found.
CREATE OR REPLACE FUNCTION decrement_stock(p_id_produk UUID, p_jumlah INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stok_sekarang INTEGER;
BEGIN
  -- Lock row exclusively to prevent concurrent updates (race condition safe)
  SELECT stok INTO v_stok_sekarang
  FROM produk
  WHERE id_produk = p_id_produk
  FOR UPDATE;

  IF v_stok_sekarang IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_stok_sekarang < p_jumlah THEN
    RETURN FALSE;
  END IF;

  UPDATE produk SET stok = stok - p_jumlah WHERE id_produk = p_id_produk;
  RETURN TRUE;
END;
$$;

-- 2. Increment stock atomically (used when order is cancelled)
CREATE OR REPLACE FUNCTION increment_stock(p_id_produk UUID, p_jumlah INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE produk SET stok = stok + p_jumlah WHERE id_produk = p_id_produk;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_stock(UUID, INTEGER) TO service_role;
