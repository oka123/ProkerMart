-- Allow all authenticated users to insert, select, update, delete from organisasi_member
-- to avoid RLS blocking issues

ALTER TABLE organisasi_member ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organisasi_member: all access for authenticated"
ON organisasi_member
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
