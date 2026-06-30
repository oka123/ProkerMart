-- Drop existing tables if they exist
DROP TABLE IF EXISTS sub_toko_invitation CASCADE;
DROP TABLE IF EXISTS sub_toko_member CASCADE;
DROP TYPE IF EXISTS sub_toko_role_enum;

-- Create enum type for sub_toko member roles
CREATE TYPE sub_toko_role_enum AS ENUM (
    'KetuaProker',
    'WakilProker',
    'SekretarisProker',
    'BendaharaProker',
    'KoorPenggalianDana',
    'WakilKoorPenggalianDana',
    'AnggotaPenggalianDana'
);

-- Create sub_toko_member table
-- Tracks members/staff of a sub_toko (proker)
CREATE TABLE sub_toko_member (
    id_member UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    role sub_toko_role_enum NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    tanggal_bergabung TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_sub_toko, id_pengguna)
);

-- Create sub_toko_invitation table
-- Tracks invitations sent to join a sub_toko
CREATE TABLE sub_toko_invitation (
    id_invitation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role sub_toko_role_enum NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    invited_by UUID REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_sub_toko_member_sub_toko ON sub_toko_member(id_sub_toko);
CREATE INDEX idx_sub_toko_member_pengguna ON sub_toko_member(id_pengguna);
CREATE INDEX idx_sub_toko_invitation_sub_toko ON sub_toko_invitation(id_sub_toko);
CREATE INDEX idx_sub_toko_invitation_email ON sub_toko_invitation(email);
CREATE INDEX idx_sub_toko_invitation_token ON sub_toko_invitation(token);
