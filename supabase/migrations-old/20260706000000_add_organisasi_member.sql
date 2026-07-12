-- Migration: Add organisasi_member table
-- Tracks membership of users (pengguna) within organizations (organisasi)

-- ENUM for member roles within an organization
CREATE TYPE member_role AS ENUM (
  'ketua',
  'wakil_ketua',
  'sekretaris',
  'bendahara',
  'ketua_pelaksana',
  'divisi_acara',
  'divisi_danus',
  'divisi_humas',
  'anggota_staff'
);

-- Organisasi Member table
CREATE TABLE organisasi_member (
    id_member UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The user who is a member
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,

    -- The organization they belong to
    id_organisasi UUID NOT NULL REFERENCES organisasi(id_organisasi) ON DELETE CASCADE,

    -- Optional: assigned to a specific sub_toko (proker), NULL means org-level scope
    id_sub_toko UUID REFERENCES sub_toko(id_sub_toko) ON DELETE SET NULL,

    -- Role/jabatan within the organization
    jabatan member_role NOT NULL DEFAULT 'anggota_staff',

    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- A user can only be a member of the same organization once
    UNIQUE(id_pengguna, id_organisasi)
);

-- Index for fast lookups by organization
CREATE INDEX idx_organisasi_member_org ON organisasi_member(id_organisasi);

-- Index for fast lookups by sub_toko scope
CREATE INDEX idx_organisasi_member_sub_toko ON organisasi_member(id_sub_toko);
