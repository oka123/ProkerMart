-- Fix infinite recursion in pengguna RLS policy

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pengguna
    WHERE id_pengguna = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "pengguna: admin can read all" ON pengguna;

-- Create the new policy using the security definer function
CREATE POLICY "pengguna: admin can read all"
ON pengguna
FOR SELECT
USING (is_admin());
