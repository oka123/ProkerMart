-- Enable RLS policies for voucher tables (previously had RLS on but no policies = all blocked)

-- Allow anyone to read active vouchers
CREATE POLICY "voucher_public_read" ON public.voucher
  FOR SELECT TO anon, authenticated USING (true);

-- Users can only see their own claimed vouchers
CREATE POLICY "voucher_pengguna_user_select" ON public.voucher_pengguna
  FOR SELECT TO authenticated USING (id_pengguna = auth.uid());

-- Users can only claim vouchers for themselves
CREATE POLICY "voucher_pengguna_user_insert" ON public.voucher_pengguna
  FOR INSERT TO authenticated WITH CHECK (id_pengguna = auth.uid());

-- Users can only update their own voucher claims (mark as used)
CREATE POLICY "voucher_pengguna_user_update" ON public.voucher_pengguna
  FOR UPDATE TO authenticated USING (id_pengguna = auth.uid());
