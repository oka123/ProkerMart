-- Add RLS update policy for buyer (pembeli) to update their own order status (e.g. Cancel/Complete)
CREATE POLICY "pesanan: pembeli can update own" ON pesanan
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id_pengguna);
