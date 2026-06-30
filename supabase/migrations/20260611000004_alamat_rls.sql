ALTER TABLE alamat_pengguna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pengguna bisa melihat alamat sendiri" 
ON alamat_pengguna FOR SELECT 
TO authenticated 
USING (auth.uid() = id_pengguna);

CREATE POLICY "Pengguna bisa menambah alamat sendiri" 
ON alamat_pengguna FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "Pengguna bisa mengubah alamat sendiri" 
ON alamat_pengguna FOR UPDATE 
TO authenticated 
USING (auth.uid() = id_pengguna) 
WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "Pengguna bisa menghapus alamat sendiri" 
ON alamat_pengguna FOR DELETE 
TO authenticated 
USING (auth.uid() = id_pengguna);
