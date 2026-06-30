-- Add RLS policies for ulasan (reviews) table
CREATE POLICY "ulasan: public can read all" ON ulasan
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "ulasan: pembeli can insert own" ON ulasan
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id_pengguna);
