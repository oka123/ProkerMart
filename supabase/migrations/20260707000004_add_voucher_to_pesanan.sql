-- Add voucher columns to pesanan table
ALTER TABLE public.pesanan
  ADD COLUMN IF NOT EXISTS id_voucher UUID REFERENCES public.voucher(id_voucher) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diskon_voucher NUMERIC DEFAULT 0;
