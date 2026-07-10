CREATE TABLE IF NOT EXISTS organisasi_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  id_organisasi uuid NOT NULL REFERENCES organisasi(id_organisasi) ON DELETE CASCADE,
  id_sub_toko uuid REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
  jabatan text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE organisasi_invitations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service role full access"
  ON organisasi_invitations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow public read access to verify tokens
CREATE POLICY "public read invitations by token"
  ON organisasi_invitations
  FOR SELECT
  USING (true);
