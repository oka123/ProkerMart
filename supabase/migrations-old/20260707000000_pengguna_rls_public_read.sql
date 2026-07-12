-- Allow all authenticated users to read basic info from pengguna table
-- This is necessary for finding users by email to invite them,
-- and for displaying names/emails in member lists.

CREATE POLICY "pengguna: authenticated users can read all"
ON pengguna
FOR SELECT
TO authenticated
USING (true);
