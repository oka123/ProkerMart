-- =============================================================================
-- ProkerMart - Full Database Schema Migration
-- Generated: 2026-07-13
-- Description: Complete schema migration for ProkerMart digital marketplace
--              ecosystem for student organizations (Ormawa).
--
-- This single file captures the entire live database structure including:
--   1. Extensions
--   2. Custom Enum Types
--   3. Functions & Procedures
--   4. Tables (in dependency order)
--   5. Triggers
--   6. Row Level Security (RLS) Policies
--   7. Storage Buckets
--
-- Usage:
--   Run this file against a fresh Supabase project via:
--   - Supabase Dashboard > SQL Editor
--   - supabase db push (with Supabase CLI)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;


-- -----------------------------------------------------------------------------
-- SECTION 2: CUSTOM ENUM TYPES
-- -----------------------------------------------------------------------------

-- User roles
CREATE TYPE public.user_role AS ENUM (
  'pembeli',
  'organisasi',
  'proker',
  'admin'
);

-- Organization/shop verification status
CREATE TYPE public.verification_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'suspended'
);

-- Shop & sub-shop active status
CREATE TYPE public.active_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- Order status flow
CREATE TYPE public.order_status AS ENUM (
  'menunggu_pembayaran',
  'menunggu_konfirmasi',
  'menunggu_produksi',
  'diproses',
  'siap_diambil',
  'dikirim',
  'selesai',
  'dibatalkan',
  'kadaluarsa'
);

-- Payment method
CREATE TYPE public.payment_method AS ENUM (
  'qris',
  'cod',
);

-- Payment status
CREATE TYPE public.payment_status AS ENUM (
  'menunggu',
  'dibayar',
  'gagal'
);

-- Delivery method for order items
CREATE TYPE public.delivery_method AS ENUM (
  'delivery',
  'pickup'
);

-- Sub-toko member roles (Proker-specific)
CREATE TYPE public.sub_toko_role_enum AS ENUM (
  'KetuaProker',
  'WakilProker',
  'SekretarisProker',
  'BendaharaProker',
  'KoorPenggalianDana',
  'WakilKoorPenggalianDana',
  'AnggotaPenggalianDana'
);

-- Organization member roles
CREATE TYPE public.member_role AS ENUM (
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

-- Invitation status
CREATE TYPE public.invitation_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);


-- -----------------------------------------------------------------------------
-- SECTION 3: FUNCTIONS (defined before tables/triggers that depend on them)
-- -----------------------------------------------------------------------------

-- Function: Auto-sync new auth.users to public.pengguna
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role user_role;
  v_nama TEXT;
BEGIN
  -- Extract role from metadata, default to 'pembeli'
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'pembeli'
  );

  -- Extract name from metadata
  v_nama := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  -- Insert into pengguna using auth.users ID as the primary key
  INSERT INTO public.pengguna (id_pengguna, nama, email, password, role, created_at)
  VALUES (
    NEW.id,
    v_nama,
    NEW.email,
    NULL,
    v_role,
    NOW()
  )
  ON CONFLICT (id_pengguna) DO NOTHING;

  -- If role is organisasi, also create a record in the organisasi table
  IF v_role = 'organisasi' THEN
    INSERT INTO public.organisasi (id_pengguna, nama_organisasi, status_verifikasi, tgl_daftar)
    VALUES (
      NEW.id,
      v_nama,
      'pending',
      NOW()
    )
    ON CONFLICT (id_pengguna) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pengguna
    WHERE id_pengguna = auth.uid() AND role = 'admin'
  );
$$;

-- Function: Get sub_toko IDs belonging to the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_sub_toko_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id_sub_toko FROM public.sub_toko_member WHERE
id_pengguna = auth.uid();
$$;

-- Function: Decrement product stock atomically (returns false if insufficient)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id_produk uuid, p_jumlah integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stok_sekarang INTEGER;
BEGIN
  SELECT stok INTO v_stok_sekarang FROM produk WHERE id_produk = p_id_produk FOR UPDATE;
  IF v_stok_sekarang IS NULL THEN RETURN FALSE; END IF;
  IF v_stok_sekarang < p_jumlah THEN RETURN FALSE; END IF;
  UPDATE produk SET stok = stok - p_jumlah WHERE id_produk = p_id_produk;
  RETURN TRUE;
END;
$$;

-- Function: Increment product stock
CREATE OR REPLACE FUNCTION public.increment_stock(p_id_produk uuid, p_jumlah integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE produk SET stok = stok + p_jumlah WHERE id_produk = p_id_produk;
  RETURN FOUND;
END;
$$;

-- Function: Get nearby sub_toko based on coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION public.get_nearby_sub_toko(
  user_lat double precision,
  user_lon double precision,
  max_distance_km double precision DEFAULT 10
)
RETURNS TABLE(id_sub_toko uuid, distance_km double precision)
LANGUAGE sql
AS $$
  SELECT
    id_sub_toko,
    distance_km
  FROM (
    SELECT
      id_sub_toko,
      -- Haversine formula (6371 = Earth radius in km)
      (6371 * acos(
        GREATEST(-1.0, LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(user_lon)) +
          sin(radians(user_lat)) * sin(radians(latitude))
        ))
      )) AS distance_km
    FROM sub_toko
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  ) AS nearby
  WHERE distance_km <= max_distance_km
  ORDER BY distance_km ASC;
$$;

-- Function: Auto-enable RLS on every new table in public schema
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL
        AND cmd.schema_name IN ('public')
        AND cmd.schema_name NOT IN ('pg_catalog','information_schema')
        AND cmd.schema_name NOT LIKE 'pg_toast%'
        AND cmd.schema_name NOT LIKE 'pg_temp%'
     THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

-- Attach event trigger for auto-RLS
CREATE EVENT TRIGGER rls_auto_enable_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();


-- -----------------------------------------------------------------------------
-- SECTION 4: TABLES (in dependency order)
-- -----------------------------------------------------------------------------

-- =========================================================
-- TABLE: pengguna
-- Core user table; mirrors auth.users via trigger
-- =========================================================
CREATE TABLE public.pengguna (
  id_pengguna     UUID          NOT NULL DEFAULT gen_random_uuid(),
  nama            VARCHAR(255)  NOT NULL,
  email           VARCHAR(255)  NOT NULL,
  password        VARCHAR(255)  DEFAULT NULL,
  role            user_role     NOT NULL DEFAULT 'pembeli',
  created_at      TIMESTAMPTZ   DEFAULT now(),
  no_telepon      VARCHAR(20),
  jenis_kelamin   VARCHAR(15),
  tanggal_lahir   DATE,
  foto_profil     VARCHAR(255),

  CONSTRAINT pengguna_pkey PRIMARY KEY (id_pengguna),
  CONSTRAINT pengguna_email_key UNIQUE (email),
  CONSTRAINT pengguna_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: organisasi
-- Student organization registration & verification
-- =========================================================
CREATE TABLE public.organisasi (
  id_organisasi     UUID                  NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna       UUID                  NOT NULL,
  nama_organisasi   VARCHAR(255)          NOT NULL,
  nomor_sk          VARCHAR(100),
  status_verifikasi verification_status   DEFAULT 'pending',
  tgl_daftar        TIMESTAMPTZ           DEFAULT now(),
  tgl_verifikasi    TIMESTAMPTZ,
  logo              VARCHAR(255),
  deskripsi         TEXT,
  email_resmi       VARCHAR(255),
  no_telp           VARCHAR(50),
  sosmed            VARCHAR(255),

  CONSTRAINT organisasi_pkey PRIMARY KEY (id_organisasi),
  CONSTRAINT organisasi_id_pengguna_key UNIQUE (id_pengguna),
  CONSTRAINT organisasi_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.organisasi ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: toko
-- Main storefront for an organization
-- =========================================================
CREATE TABLE public.toko (
  id_toko       UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_organisasi UUID          NOT NULL,
  nama_toko     VARCHAR(255)  NOT NULL,
  deskripsi     TEXT,
  logo          VARCHAR(255),
  status        active_status DEFAULT 'active',
  tgl_dibuat    TIMESTAMPTZ   DEFAULT now(),
  latitude      NUMERIC,
  longitude     NUMERIC,

  CONSTRAINT toko_pkey PRIMARY KEY (id_toko),
  CONSTRAINT toko_id_organisasi_fkey FOREIGN KEY (id_organisasi)
    REFERENCES public.organisasi (id_organisasi) ON DELETE CASCADE
);

ALTER TABLE public.toko ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: sub_toko
-- Proker-specific sub-shop under a main toko
-- =========================================================
CREATE TABLE public.sub_toko (
  id_sub_toko         UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_toko             UUID          NOT NULL,
  id_pengguna         UUID          NOT NULL,
  nama_proker         VARCHAR(255)  NOT NULL,
  deskripsi           TEXT,
  foto_sampul         VARCHAR(255),
  jadwal_operasional  TEXT,
  status              active_status DEFAULT 'active',
  tgl_dibuat          TIMESTAMPTZ   DEFAULT now(),
  latitude            NUMERIC,
  longitude           NUMERIC,
  alamat              TEXT,
  kategori            VARCHAR(100),
  tanggal_mulai       DATE,
  tanggal_selesai     DATE,
  target_omzet        NUMERIC,

  CONSTRAINT sub_toko_pkey PRIMARY KEY (id_sub_toko),
  CONSTRAINT sub_toko_id_toko_fkey FOREIGN KEY (id_toko)
    REFERENCES public.toko (id_toko) ON DELETE CASCADE,
  CONSTRAINT sub_toko_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.sub_toko ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: sub_toko_member
-- Members/panitia of a sub-toko (Proker team)
-- =========================================================
CREATE TABLE public.sub_toko_member (
  id_member           UUID                NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko         UUID                NOT NULL,
  id_pengguna         UUID                NOT NULL,
  role                sub_toko_role_enum  NOT NULL,
  status              VARCHAR(50)         DEFAULT 'active',
  tanggal_bergabung   TIMESTAMPTZ         DEFAULT now(),
  latitude            NUMERIC,
  longitude           NUMERIC,

  CONSTRAINT sub_toko_member_pkey PRIMARY KEY (id_member),
  CONSTRAINT sub_toko_member_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE,
  CONSTRAINT sub_toko_member_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.sub_toko_member ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: sub_toko_invitation
-- Pending invitations to join a sub-toko
-- =========================================================
CREATE TABLE public.sub_toko_invitation (
  id_invitation   UUID                NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko     UUID                NOT NULL,
  email           VARCHAR(255)        NOT NULL,
  role            sub_toko_role_enum  NOT NULL,
  token           VARCHAR(255)        NOT NULL,
  status          VARCHAR(50)         DEFAULT 'pending',
  invited_by      UUID,
  expires_at      TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ         DEFAULT now(),

  CONSTRAINT sub_toko_invitation_pkey PRIMARY KEY (id_invitation),
  CONSTRAINT sub_toko_invitation_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE,
  CONSTRAINT sub_toko_invitation_invited_by_fkey FOREIGN KEY (invited_by)
    REFERENCES public.pengguna (id_pengguna) ON DELETE SET NULL
);

ALTER TABLE public.sub_toko_invitation ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: organisasi_member
-- Members of the main organization (ormawa staff)
-- =========================================================
CREATE TABLE public.organisasi_member (
  id_member     UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna   UUID          NOT NULL,
  id_organisasi UUID          NOT NULL,
  id_sub_toko   UUID,
  jabatan       member_role   NOT NULL DEFAULT 'anggota_staff',
  joined_at     TIMESTAMPTZ   DEFAULT now(),
  updated_at    TIMESTAMPTZ   DEFAULT now(),

  CONSTRAINT organisasi_member_pkey PRIMARY KEY (id_member),
  CONSTRAINT organisasi_member_id_pengguna_id_organisasi_key UNIQUE (id_pengguna, id_organisasi),
  CONSTRAINT organisasi_member_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT organisasi_member_id_organisasi_fkey FOREIGN KEY (id_organisasi)
    REFERENCES public.organisasi (id_organisasi) ON DELETE CASCADE,
  CONSTRAINT organisasi_member_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE SET NULL
);

ALTER TABLE public.organisasi_member ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: organisasi_invitations
-- Invitations for joining an organization
-- =========================================================
CREATE TABLE public.organisasi_invitations (
  id            UUID    NOT NULL DEFAULT gen_random_uuid(),
  email         TEXT    NOT NULL,
  id_organisasi UUID    NOT NULL,
  id_sub_toko   UUID,
  jabatan       TEXT    NOT NULL,
  token         UUID    NOT NULL DEFAULT gen_random_uuid(),
  status        TEXT    NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT organisasi_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT organisasi_invitations_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text])),
  CONSTRAINT organisasi_invitations_id_organisasi_fkey FOREIGN KEY (id_organisasi)
    REFERENCES public.organisasi (id_organisasi) ON DELETE CASCADE,
  CONSTRAINT organisasi_invitations_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE
);

ALTER TABLE public.organisasi_invitations ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: produk
-- Products listed by a sub-toko
-- =========================================================
CREATE TABLE public.produk (
  id_produk           UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko         UUID          NOT NULL,
  nama_produk         VARCHAR(255)  NOT NULL,
  deskripsi           TEXT,
  harga               NUMERIC       NOT NULL,
  stok                INTEGER       NOT NULL DEFAULT 0,
  foto                VARCHAR(255),
  kategori            VARCHAR(100),
  status_aktif        BOOLEAN       DEFAULT true,
  tgl_dibuat          TIMESTAMPTZ   DEFAULT now(),
  metode_jualan       VARCHAR(255)  DEFAULT 'pickup,delivery',
  preorder            BOOLEAN       NOT NULL DEFAULT false,
  periode_open_start  TIMESTAMPTZ,
  periode_open_end    TIMESTAMPTZ,
  estimasi_siap       DATE,
  min_order           INTEGER       DEFAULT 1,
  dp_persen           INTEGER       DEFAULT 0,

  CONSTRAINT produk_pkey PRIMARY KEY (id_produk),
  CONSTRAINT produk_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE
);

ALTER TABLE public.produk ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: voucher
-- Discount vouchers created by toko owners
-- =========================================================
CREATE TABLE public.voucher (
  id_voucher    UUID          NOT NULL DEFAULT gen_random_uuid(),
  kode_voucher  VARCHAR(255)  NOT NULL,
  nama_voucher  VARCHAR(255)  NOT NULL,
  deskripsi     TEXT,
  tipe_diskon   VARCHAR(255)  DEFAULT 'persentase',
  nilai_diskon  NUMERIC       NOT NULL,
  max_diskon    NUMERIC,
  min_belanja   NUMERIC       DEFAULT 0,
  kuota         INTEGER       DEFAULT 0,
  tgl_mulai     TIMESTAMPTZ   DEFAULT now(),
  tgl_berakhir  TIMESTAMPTZ   NOT NULL,
  status        BOOLEAN       DEFAULT true,
  id_toko       UUID,

  CONSTRAINT voucher_pkey PRIMARY KEY (id_voucher),
  CONSTRAINT voucher_id_toko_fkey FOREIGN KEY (id_toko)
    REFERENCES public.toko (id_toko) ON DELETE CASCADE
);

ALTER TABLE public.voucher ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: pesanan
-- Customer orders
-- =========================================================
CREATE TABLE public.pesanan (
  id_pesanan          UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna         UUID          NOT NULL,
  id_sub_toko         UUID          NOT NULL,
  total_harga         NUMERIC       NOT NULL,
  kode_unik           TEXT          NOT NULL,
  tgl_pesan           TIMESTAMPTZ   DEFAULT now(),
  alamat_pengambilan  TEXT,
  status_pesanan      order_status  DEFAULT 'menunggu_pembayaran',
  metode_pembayaran   TEXT,
  snap_token          VARCHAR(255),
  dicatat_oleh        UUID,
  is_preorder         BOOLEAN       DEFAULT false,
  dp_dibayar          NUMERIC       DEFAULT 0,
  pengantar_id        UUID,
  lat_pengantar       DOUBLE PRECISION,
  lng_pengantar       DOUBLE PRECISION,
  lokasi_updated_at   TIMESTAMPTZ,
  id_ronde            UUID,
  urutan_antar        INTEGER,
  is_tujuan_aktif     BOOLEAN       DEFAULT false,
  alasan_batal        TEXT,
  dibatalkan_oleh     TEXT,
  status_refund       TEXT,
  id_voucher          UUID,
  diskon_voucher      NUMERIC       DEFAULT 0,

  CONSTRAINT pesanan_pkey PRIMARY KEY (id_pesanan),
  CONSTRAINT pesanan_kode_unik_key UNIQUE (kode_unik),
  CONSTRAINT pesanan_dibatalkan_oleh_check
    CHECK (dibatalkan_oleh = ANY (ARRAY['pembeli'::text, 'penjual'::text, 'sistem'::text])),
  CONSTRAINT pesanan_status_refund_check
    CHECK (status_refund = ANY (ARRAY['tidak_perlu'::text, 'diproses'::text, 'selesai'::text, 'gagal'::text])),
  CONSTRAINT pesanan_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT pesanan_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE RESTRICT,
  CONSTRAINT pesanan_dicatat_oleh_fkey FOREIGN KEY (dicatat_oleh)
    REFERENCES public.sub_toko_member (id_member) ON DELETE SET NULL,
  CONSTRAINT pesanan_pengantar_id_fkey FOREIGN KEY (pengantar_id)
    REFERENCES public.sub_toko_member (id_member),
  CONSTRAINT pesanan_id_voucher_fkey FOREIGN KEY (id_voucher)
    REFERENCES public.voucher (id_voucher) ON DELETE SET NULL
);

ALTER TABLE public.pesanan ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: detail_pesanan
-- Line items for each order
-- =========================================================
CREATE TABLE public.detail_pesanan (
  id_detail           UUID            NOT NULL DEFAULT gen_random_uuid(),
  id_pesanan          UUID            NOT NULL,
  id_produk           UUID            NOT NULL,
  jumlah              INTEGER         NOT NULL,
  harga_satuan        NUMERIC         NOT NULL,
  sub_total           NUMERIC         NOT NULL,
  metode_pengambilan  delivery_method DEFAULT 'pickup',
  tgl_ambil           TEXT,

  CONSTRAINT detail_pesanan_pkey PRIMARY KEY (id_detail),
  CONSTRAINT detail_pesanan_id_pesanan_fkey FOREIGN KEY (id_pesanan)
    REFERENCES public.pesanan (id_pesanan) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT detail_pesanan_id_produk_fkey FOREIGN KEY (id_produk)
    REFERENCES public.produk (id_produk) ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE public.detail_pesanan ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: pembayaran
-- Payment records for orders (1-to-1 with pesanan)
-- =========================================================
CREATE TABLE public.pembayaran (
  id_pembayaran     UUID            NOT NULL DEFAULT gen_random_uuid(),
  id_pesanan        UUID            NOT NULL,
  metode_pembayaran payment_method  NOT NULL,
  bukti_bayar       VARCHAR(255),
  tgl_bayar         TIMESTAMPTZ,
  tgl_konfirmasi    TIMESTAMPTZ,
  status_bayar      payment_status  DEFAULT 'menunggu',
  catatan           TEXT,

  CONSTRAINT pembayaran_pkey PRIMARY KEY (id_pembayaran),
  CONSTRAINT pembayaran_id_pesanan_key UNIQUE (id_pesanan),
  CONSTRAINT pembayaran_id_pesanan_fkey FOREIGN KEY (id_pesanan)
    REFERENCES public.pesanan (id_pesanan) ON DELETE CASCADE
);

ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: notifikasi
-- In-app notifications for users
-- =========================================================
CREATE TABLE public.notifikasi (
  id_notifikasi   UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna     UUID          NOT NULL,
  judul           VARCHAR(255)  NOT NULL,
  konten          TEXT          NOT NULL,
  link_terkait    VARCHAR(255),
  status_dibaca   BOOLEAN       DEFAULT false,
  tgl_kirim       TIMESTAMPTZ   DEFAULT now(),
  tgl_baca        TIMESTAMPTZ,

  CONSTRAINT notifikasi_pkey PRIMARY KEY (id_notifikasi),
  CONSTRAINT notifikasi_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: keranjang
-- Shopping cart items
-- =========================================================
CREATE TABLE public.keranjang (
  id_keranjang      UUID        NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna       UUID        NOT NULL,
  id_produk         UUID        NOT NULL,
  jumlah            INTEGER     NOT NULL DEFAULT 1,
  tgl_ditambahkan   TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT keranjang_pkey PRIMARY KEY (id_keranjang),
  CONSTRAINT keranjang_id_pengguna_id_produk_key UNIQUE (id_pengguna, id_produk),
  CONSTRAINT keranjang_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT keranjang_id_produk_fkey FOREIGN KEY (id_produk)
    REFERENCES public.produk (id_produk) ON DELETE CASCADE
);

ALTER TABLE public.keranjang ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: alamat_pembeli
-- Saved delivery addresses for buyers
-- =========================================================
CREATE TABLE public.alamat_pembeli (
  id_alamat         UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna       UUID          NOT NULL,
  nama_penerima     VARCHAR(255)  NOT NULL,
  no_telepon        VARCHAR(20)   NOT NULL,
  provinsi          VARCHAR(100)  NOT NULL,
  kota              VARCHAR(100)  NOT NULL,
  kecamatan         VARCHAR(100)  NOT NULL,
  kode_pos          VARCHAR(10)   NOT NULL,
  detail_jalan      TEXT          NOT NULL,
  catatan_tambahan  VARCHAR(255),
  is_utama          BOOLEAN       DEFAULT false,
  tipe_alamat       VARCHAR(50)   DEFAULT 'Rumah',
  tgl_dibuat        TIMESTAMPTZ   DEFAULT now(),
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,

  CONSTRAINT alamat_pengguna_pkey PRIMARY KEY (id_alamat),
  CONSTRAINT alamat_pengguna_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.alamat_pembeli ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: ulasan
-- Product/sub-toko reviews from buyers
-- =========================================================
CREATE TABLE public.ulasan (
  id_ulasan     UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna   UUID    NOT NULL,
  id_sub_toko   UUID    NOT NULL,
  id_pesanan    UUID,
  rating        INTEGER NOT NULL,
  komentar      TEXT,
  tgl_ulasan    TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT ulasan_pkey PRIMARY KEY (id_ulasan),
  CONSTRAINT ulasan_rating_check CHECK ((rating >= 1) AND (rating <= 5)),
  CONSTRAINT ulasan_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT ulasan_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE,
  CONSTRAINT ulasan_id_pesanan_fkey FOREIGN KEY (id_pesanan)
    REFERENCES public.pesanan (id_pesanan) ON DELETE SET NULL
);

ALTER TABLE public.ulasan ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: voucher_pengguna
-- Voucher claim records per user
-- =========================================================
CREATE TABLE public.voucher_pengguna (
  id_klaim      UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna   UUID    NOT NULL,
  id_voucher    UUID    NOT NULL,
  status_pakai  BOOLEAN DEFAULT false,
  tgl_klaim     TIMESTAMPTZ DEFAULT now(),
  tgl_pakai     TIMESTAMPTZ,

  CONSTRAINT voucher_pengguna_pkey PRIMARY KEY (id_klaim),
  CONSTRAINT voucher_pengguna_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT voucher_pengguna_id_voucher_fkey FOREIGN KEY (id_voucher)
    REFERENCES public.voucher (id_voucher) ON DELETE CASCADE
);

ALTER TABLE public.voucher_pengguna ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: rekap_jualan_offline
-- Offline sales recap recorded by panitia
-- =========================================================
CREATE TABLE public.rekap_jualan_offline (
  id                  UUID          NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko         UUID          NOT NULL,
  id_member           UUID          NOT NULL,
  jumlah_item         INTEGER       NOT NULL DEFAULT 1,
  total_harga         NUMERIC       NOT NULL DEFAULT 0,
  catatan             TEXT,
  tanggal             DATE          NOT NULL DEFAULT CURRENT_DATE,
  dicatat_oleh        UUID          NOT NULL,
  created_at          TIMESTAMPTZ   DEFAULT now(),
  id_produk           UUID          NOT NULL,
  metode_pembayaran   VARCHAR(20)   NOT NULL DEFAULT 'cod',

  CONSTRAINT rekap_jualan_offline_pkey PRIMARY KEY (id),
  CONSTRAINT rekap_jualan_offline_metode_pembayaran_check
    CHECK ((metode_pembayaran::text = ANY ((ARRAY['qris'::character varying, 'cod'::character varying])::text[]))),
  CONSTRAINT rekap_jualan_offline_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE,
  CONSTRAINT rekap_jualan_offline_id_member_fkey FOREIGN KEY (id_member)
    REFERENCES public.sub_toko_member (id_member) ON DELETE CASCADE,
  CONSTRAINT rekap_jualan_offline_dicatat_oleh_fkey FOREIGN KEY (dicatat_oleh)
    REFERENCES public.sub_toko_member (id_member) ON DELETE RESTRICT,
  CONSTRAINT rekap_jualan_offline_id_produk_fkey FOREIGN KEY (id_produk)
    REFERENCES public.produk (id_produk) ON DELETE RESTRICT
);

ALTER TABLE public.rekap_jualan_offline ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: penarikan_saldo
-- Balance withdrawal requests from sub-toko
-- =========================================================
CREATE TABLE public.penarikan_saldo (
  id            UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko   UUID    NOT NULL,
  jumlah        NUMERIC NOT NULL,
  nama_bank     TEXT    NOT NULL,
  no_rekening   TEXT    NOT NULL,
  nama_pemilik  TEXT    NOT NULL,
  catatan       TEXT,
  tgl_tarik     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT penarikan_saldo_pkey PRIMARY KEY (id),
  CONSTRAINT penarikan_saldo_jumlah_check CHECK (jumlah > 0),
  CONSTRAINT penarikan_saldo_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE
);

ALTER TABLE public.penarikan_saldo ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: chat_rooms (legacy buyer-seller chat)
-- =========================================================
CREATE TABLE public.chat_rooms (
  id_room     UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_pembeli  UUID    NOT NULL,
  id_sub_toko UUID    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id_room),
  CONSTRAINT chat_rooms_id_pembeli_id_sub_toko_key UNIQUE (id_pembeli, id_sub_toko),
  CONSTRAINT chat_rooms_id_pembeli_fkey FOREIGN KEY (id_pembeli)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT chat_rooms_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: chat_messages (legacy, messages in chat_rooms)
-- =========================================================
CREATE TABLE public.chat_messages (
  id_message  UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_room     UUID    NOT NULL,
  id_pengirim UUID    NOT NULL,
  pesan       TEXT    NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT chat_messages_pkey PRIMARY KEY (id_message),
  CONSTRAINT chat_messages_id_room_fkey FOREIGN KEY (id_room)
    REFERENCES public.chat_rooms (id_room) ON DELETE CASCADE,
  CONSTRAINT chat_messages_id_pengirim_fkey FOREIGN KEY (id_pengirim)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: percakapan
-- Admin support conversations
-- =========================================================
CREATE TABLE public.percakapan (
  id            UUID    NOT NULL DEFAULT gen_random_uuid(),
  judul         TEXT    NOT NULL,
  kategori      TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'aktif',
  id_pengguna   UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  role_konteks  TEXT    NOT NULL DEFAULT 'pembeli',

  CONSTRAINT percakapan_pkey PRIMARY KEY (id),
  CONSTRAINT percakapan_kategori_check
    CHECK (kategori = ANY (ARRAY['pembatalan'::text, 'bantuan'::text, 'laporan'::text, 'kendala'::text, 'lainnya'::text])),
  CONSTRAINT percakapan_status_check
    CHECK (status = ANY (ARRAY['aktif'::text, 'selesai'::text])),
  CONSTRAINT percakapan_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE SET NULL
);

ALTER TABLE public.percakapan ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: pesan_chat
-- Messages in admin support conversations
-- =========================================================
CREATE TABLE public.pesan_chat (
  id              UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_percakapan   UUID    NOT NULL,
  id_pengirim     UUID,
  isi             TEXT    NOT NULL,
  is_admin        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pesan_chat_pkey PRIMARY KEY (id),
  CONSTRAINT pesan_chat_id_percakapan_fkey FOREIGN KEY (id_percakapan)
    REFERENCES public.percakapan (id) ON DELETE CASCADE,
  CONSTRAINT pesan_chat_id_pengirim_fkey FOREIGN KEY (id_pengirim)
    REFERENCES public.pengguna (id_pengguna) ON DELETE SET NULL
);

ALTER TABLE public.pesan_chat ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: chat_toko
-- Direct chat rooms between buyer and a sub-toko
-- =========================================================
CREATE TABLE public.chat_toko (
  id          UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_sub_toko UUID    NOT NULL,
  id_pembeli  UUID    NOT NULL,
  id_pesanan  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chat_toko_pkey PRIMARY KEY (id),
  CONSTRAINT chat_toko_id_sub_toko_id_pembeli_key UNIQUE (id_sub_toko, id_pembeli),
  CONSTRAINT chat_toko_id_sub_toko_fkey FOREIGN KEY (id_sub_toko)
    REFERENCES public.sub_toko (id_sub_toko) ON DELETE CASCADE,
  CONSTRAINT chat_toko_id_pembeli_fkey FOREIGN KEY (id_pembeli)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE,
  CONSTRAINT chat_toko_id_pesanan_fkey FOREIGN KEY (id_pesanan)
    REFERENCES public.pesanan (id_pesanan) ON DELETE SET NULL
);

ALTER TABLE public.chat_toko ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: pesan_toko
-- Messages inside chat_toko conversations
-- =========================================================
CREATE TABLE public.pesan_toko (
  id            UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_chat       UUID    NOT NULL,
  id_pengirim   UUID    NOT NULL,
  isi           TEXT    NOT NULL,
  is_from_toko  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pesan_toko_pkey PRIMARY KEY (id),
  CONSTRAINT pesan_toko_id_chat_fkey FOREIGN KEY (id_chat)
    REFERENCES public.chat_toko (id) ON DELETE CASCADE,
  CONSTRAINT pesan_toko_id_pengirim_fkey FOREIGN KEY (id_pengirim)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.pesan_toko ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: push_subscriptions
-- Web Push API subscription data per user device
-- =========================================================
CREATE TABLE public.push_subscriptions (
  id          UUID    NOT NULL DEFAULT gen_random_uuid(),
  id_pengguna UUID    NOT NULL,
  endpoint    TEXT    NOT NULL,
  p256dh      TEXT    NOT NULL,
  auth        TEXT    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT push_subscriptions_id_pengguna_fkey FOREIGN KEY (id_pengguna)
    REFERENCES public.pengguna (id_pengguna) ON DELETE CASCADE
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: undangan_toko
-- Admin-sent invitation link for org to create a toko
-- =========================================================
CREATE TABLE public.undangan_toko (
  id          UUID    NOT NULL DEFAULT gen_random_uuid(),
  email       TEXT    NOT NULL,
  nama_toko   TEXT    NOT NULL,
  token       UUID    NOT NULL DEFAULT gen_random_uuid(),
  status      TEXT    NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT undangan_toko_pkey PRIMARY KEY (id),
  CONSTRAINT undangan_toko_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text]))
);

ALTER TABLE public.undangan_toko ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TABLE: undangan_admin
-- Admin role invitation link
-- =========================================================
CREATE TABLE public.undangan_admin (
  id          UUID    NOT NULL DEFAULT gen_random_uuid(),
  email       TEXT    NOT NULL,
  token       UUID    NOT NULL DEFAULT gen_random_uuid(),
  status      TEXT    NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT undangan_admin_pkey PRIMARY KEY (id),
  CONSTRAINT undangan_admin_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text]))
);

ALTER TABLE public.undangan_admin ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- SECTION 5: TRIGGERS
-- -----------------------------------------------------------------------------

-- Trigger: Sync new user registration from auth.users to public.pengguna
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Auto-update updated_at on push_subscriptions
CREATE OR REPLACE TRIGGER update_push_subscriptions_modtime
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Trigger: Webhook notification on order status change
-- NOTE: Update the URL to your production deployment before running.
-- This requires pg_net extension and supabase_functions schema.
CREATE OR REPLACE TRIGGER "Notifikasi Perubahan Status Pesanan"
  AFTER UPDATE ON public.pesanan
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://prokermart-test.vercel.app/api/webhooks/supabase/order-status',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '5000'
  );


-- -----------------------------------------------------------------------------
-- SECTION 6: ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- ===== pengguna ===============================================================
CREATE POLICY "pengguna: user can read own record"
  ON public.pengguna FOR SELECT TO public
  USING (auth.uid() = id_pengguna);

CREATE POLICY "pengguna: authenticated users can read all"
  ON public.pengguna FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pengguna: admin can read all"
  ON public.pengguna FOR SELECT TO public
  USING (is_admin());

CREATE POLICY "pengguna: user can update own record"
  ON public.pengguna FOR UPDATE TO public
  USING (auth.uid() = id_pengguna)
  WITH CHECK (auth.uid() = id_pengguna);

-- ===== organisasi =============================================================
CREATE POLICY "organisasi: public can read all"
  ON public.organisasi FOR SELECT TO public
  USING (true);

CREATE POLICY "organisasi: owner can update own record"
  ON public.organisasi FOR UPDATE TO public
  USING (auth.uid() = id_pengguna)
  WITH CHECK (auth.uid() = id_pengguna);

-- ===== toko ===================================================================
CREATE POLICY "toko: public can read all"
  ON public.toko FOR SELECT TO public
  USING (true);

CREATE POLICY "toko: organisasi owner can insert"
  ON public.toko FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM organisasi
    WHERE organisasi.id_organisasi = toko.id_organisasi
      AND organisasi.id_pengguna = auth.uid()
  ));

CREATE POLICY "toko: organisasi owner can update"
  ON public.toko FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM organisasi
    WHERE organisasi.id_organisasi = toko.id_organisasi
      AND organisasi.id_pengguna = auth.uid()
  ));

-- ===== sub_toko ===============================================================
CREATE POLICY "sub_toko: public can read all"
  ON public.sub_toko FOR SELECT TO public
  USING (true);

CREATE POLICY "sub_toko: proker owner can insert"
  ON public.sub_toko FOR INSERT TO public
  WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "sub_toko: proker owner can update"
  ON public.sub_toko FOR UPDATE TO public
  USING (auth.uid() = id_pengguna);

CREATE POLICY "sub_toko: proker owner can delete"
  ON public.sub_toko FOR DELETE TO public
  USING (auth.uid() = id_pengguna);

CREATE POLICY "sub_toko: org owner can update"
  ON public.sub_toko FOR UPDATE TO public
  USING ((id_pengguna = auth.uid()) OR (EXISTS (
    SELECT 1 FROM toko t
    JOIN organisasi o ON t.id_organisasi = o.id_organisasi
    WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
  )));

CREATE POLICY "sub_toko: org owner can delete"
  ON public.sub_toko FOR DELETE TO public
  USING ((id_pengguna = auth.uid()) OR (EXISTS (
    SELECT 1 FROM toko t
    JOIN organisasi o ON t.id_organisasi = o.id_organisasi
    WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
  )));

CREATE POLICY "sub_toko: organisasi owner can delete"
  ON public.sub_toko FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM toko t
    JOIN organisasi o ON t.id_organisasi = o.id_organisasi
    WHERE t.id_toko = sub_toko.id_toko AND o.id_pengguna = auth.uid()
  ));

CREATE POLICY "sub_toko: organisasi members can delete"
  ON public.sub_toko FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM toko t
    JOIN organisasi_member om ON t.id_organisasi = om.id_organisasi
    WHERE t.id_toko = sub_toko.id_toko AND om.id_pengguna = auth.uid()
  ));

-- ===== sub_toko_member ========================================================
CREATE POLICY "mr"
  ON public.sub_toko_member FOR SELECT TO public
  USING (id_sub_toko IN (SELECT get_user_sub_toko_ids()));

CREATE POLICY "member can update own record"
  ON public.sub_toko_member FOR UPDATE TO public
  USING (auth.uid() = id_pengguna);

-- ===== organisasi_member ======================================================
CREATE POLICY "organisasi_member: all access for authenticated"
  ON public.organisasi_member FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ===== organisasi_invitations =================================================
CREATE POLICY "public read invitations by token"
  ON public.organisasi_invitations FOR SELECT TO public
  USING (true);

CREATE POLICY "service role full access"
  ON public.organisasi_invitations FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- ===== produk =================================================================
CREATE POLICY "produk: public can read all"
  ON public.produk FOR SELECT TO public
  USING (true);

CREATE POLICY "produk: sub_toko owner can insert"
  ON public.produk FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_toko
    WHERE sub_toko.id_sub_toko = produk.id_sub_toko
      AND sub_toko.id_pengguna = auth.uid()
  ));

CREATE POLICY "produk: sub_toko owner can update"
  ON public.produk FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko
    WHERE sub_toko.id_sub_toko = produk.id_sub_toko
      AND sub_toko.id_pengguna = auth.uid()
  ));

CREATE POLICY "sub_toko member can read produk"
  ON public.produk FOR SELECT TO public
  USING (id_sub_toko IN (SELECT get_user_sub_toko_ids()));

CREATE POLICY "sub_toko member can insert produk"
  ON public.produk FOR INSERT TO public
  WITH CHECK (id_sub_toko IN (SELECT get_user_sub_toko_ids()));

CREATE POLICY "sub_toko member can update produk"
  ON public.produk FOR UPDATE TO public
  USING (id_sub_toko IN (SELECT get_user_sub_toko_ids()));

CREATE POLICY "sub_toko member can delete produk"
  ON public.produk FOR DELETE TO public
  USING (id_sub_toko IN (SELECT get_user_sub_toko_ids()));

-- ===== pesanan ================================================================
CREATE POLICY "pesanan: pembeli can insert own"
  ON public.pesanan FOR INSERT TO public
  WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "pesanan: pembeli can read own"
  ON public.pesanan FOR SELECT TO public
  USING (auth.uid() = id_pengguna);

CREATE POLICY "pesanan: pembeli can update own"
  ON public.pesanan FOR UPDATE TO authenticated
  USING (auth.uid() = id_pengguna);

CREATE POLICY "pesanan: sub_toko member can read incoming"
  ON public.pesanan FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko_member
    WHERE sub_toko_member.id_sub_toko = pesanan.id_sub_toko
      AND sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

CREATE POLICY "pesanan: sub_toko member can update status"
  ON public.pesanan FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko_member
    WHERE sub_toko_member.id_sub_toko = pesanan.id_sub_toko
      AND sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

CREATE POLICY "pesanan: sub_toko owner can read incoming"
  ON public.pesanan FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko
    WHERE sub_toko.id_sub_toko = pesanan.id_sub_toko
      AND sub_toko.id_pengguna = auth.uid()
  ));

CREATE POLICY "pesanan: sub_toko owner can update status"
  ON public.pesanan FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko
    WHERE sub_toko.id_sub_toko = pesanan.id_sub_toko
      AND sub_toko.id_pengguna = auth.uid()
  ));

-- ===== detail_pesanan =========================================================
CREATE POLICY "detail_pesanan: pembeli can read own"
  ON public.detail_pesanan FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM pesanan
    WHERE pesanan.id_pesanan = detail_pesanan.id_pesanan
      AND pesanan.id_pengguna = auth.uid()
  ));

CREATE POLICY "detail_pesanan: pembeli can insert own"
  ON public.detail_pesanan FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM pesanan
    WHERE pesanan.id_pesanan = detail_pesanan.id_pesanan
      AND pesanan.id_pengguna = auth.uid()
  ));

CREATE POLICY "detail_pesanan: sub_toko member can read"
  ON public.detail_pesanan FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM pesanan
    JOIN sub_toko_member ON sub_toko_member.id_sub_toko = pesanan.id_sub_toko
    WHERE pesanan.id_pesanan = detail_pesanan.id_pesanan
      AND sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

-- ===== pembayaran =============================================================
CREATE POLICY "pembayaran: pembeli can read own"
  ON public.pembayaran FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM pesanan
    WHERE pesanan.id_pesanan = pembayaran.id_pesanan
      AND pesanan.id_pengguna = auth.uid()
  ));

CREATE POLICY "pembayaran: pembeli can insert own"
  ON public.pembayaran FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM pesanan
    WHERE pesanan.id_pesanan = pembayaran.id_pesanan
      AND pesanan.id_pengguna = auth.uid()
  ));

CREATE POLICY "pembayaran: sub_toko member can read"
  ON public.pembayaran FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM pesanan
    JOIN sub_toko_member ON sub_toko_member.id_sub_toko = pesanan.id_sub_toko
    WHERE pesanan.id_pesanan = pembayaran.id_pesanan
      AND sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

-- ===== notifikasi =============================================================
CREATE POLICY "notifikasi: user can read own"
  ON public.notifikasi FOR SELECT TO public
  USING (auth.uid() = id_pengguna);

CREATE POLICY "notifikasi: user can update own (mark as read)"
  ON public.notifikasi FOR UPDATE TO public
  USING (auth.uid() = id_pengguna)
  WITH CHECK (auth.uid() = id_pengguna);

-- ===== keranjang ==============================================================
CREATE POLICY "Pengguna dapat melihat keranjangnya sendiri"
  ON public.keranjang FOR SELECT TO public
  USING (id_pengguna = auth.uid());

CREATE POLICY "Pengguna dapat menambah keranjangnya sendiri"
  ON public.keranjang FOR INSERT TO public
  WITH CHECK (id_pengguna = auth.uid());

CREATE POLICY "Pengguna dapat mengubah keranjangnya sendiri"
  ON public.keranjang FOR UPDATE TO public
  USING (id_pengguna = auth.uid());

CREATE POLICY "Pengguna dapat menghapus item keranjangnya sendiri"
  ON public.keranjang FOR DELETE TO public
  USING (id_pengguna = auth.uid());

-- ===== alamat_pembeli =========================================================
CREATE POLICY "Pembeli bisa melihat alamat sendiri"
  ON public.alamat_pembeli FOR SELECT TO authenticated
  USING (auth.uid() = id_pengguna);

CREATE POLICY "Pembeli bisa menambah alamat sendiri"
  ON public.alamat_pembeli FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "Pembeli bisa mengubah alamat sendiri"
  ON public.alamat_pembeli FOR UPDATE TO authenticated
  USING (auth.uid() = id_pengguna)
  WITH CHECK (auth.uid() = id_pengguna);

CREATE POLICY "Pembeli bisa menghapus alamat sendiri"
  ON public.alamat_pembeli FOR DELETE TO authenticated
  USING (auth.uid() = id_pengguna);

-- ===== ulasan =================================================================
CREATE POLICY "ulasan: public can read all"
  ON public.ulasan FOR SELECT TO public
  USING (true);

CREATE POLICY "ulasan: pembeli can insert own"
  ON public.ulasan FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id_pengguna);

-- ===== voucher ================================================================
CREATE POLICY "voucher_public_read"
  ON public.voucher FOR SELECT TO anon, authenticated
  USING (true);

-- ===== voucher_pengguna =======================================================
CREATE POLICY "voucher_pengguna_user_select"
  ON public.voucher_pengguna FOR SELECT TO authenticated
  USING (id_pengguna = auth.uid());

CREATE POLICY "voucher_pengguna_user_insert"
  ON public.voucher_pengguna FOR INSERT TO authenticated
  WITH CHECK (id_pengguna = auth.uid());

CREATE POLICY "voucher_pengguna_user_update"
  ON public.voucher_pengguna FOR UPDATE TO authenticated
  USING (id_pengguna = auth.uid());

-- ===== rekap_jualan_offline ===================================================
CREATE POLICY "member can read rekap"
  ON public.rekap_jualan_offline FOR SELECT TO public
  USING (id_sub_toko IN (
    SELECT sub_toko_member.id_sub_toko FROM sub_toko_member
    WHERE sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

CREATE POLICY "pengdan can insert rekap"
  ON public.rekap_jualan_offline FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM sub_toko_member
    WHERE sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.id_sub_toko = rekap_jualan_offline.id_sub_toko
      AND sub_toko_member.status::text = 'active'
      AND sub_toko_member.role = ANY (ARRAY[
        'BendaharaProker'::sub_toko_role_enum,
        'KoorPenggalianDana'::sub_toko_role_enum,
        'WakilKoorPenggalianDana'::sub_toko_role_enum,
        'AnggotaPenggalianDana'::sub_toko_role_enum
      ])
  ));

CREATE POLICY "recorder can delete rekap"
  ON public.rekap_jualan_offline FOR DELETE TO public
  USING (dicatat_oleh IN (
    SELECT sub_toko_member.id_member FROM sub_toko_member
    WHERE sub_toko_member.id_pengguna = auth.uid()
      AND sub_toko_member.status::text = 'active'
  ));

-- ===== penarikan_saldo ========================================================
CREATE POLICY "proker can manage own penarikan"
  ON public.penarikan_saldo FOR ALL TO public
  USING (id_sub_toko IN (
    SELECT sub_toko_member.id_sub_toko FROM sub_toko_member
    WHERE sub_toko_member.id_pengguna = auth.uid()
  ));

-- ===== chat_rooms =============================================================
CREATE POLICY "Pembeli bisa melihat chat room miliknya"
  ON public.chat_rooms FOR SELECT TO public
  USING (auth.uid() = id_pembeli);

CREATE POLICY "Pembeli bisa membuat chat room"
  ON public.chat_rooms FOR INSERT TO public
  WITH CHECK (auth.uid() = id_pembeli);

CREATE POLICY "Panitia bisa melihat chat room sub tokonya"
  ON public.chat_rooms FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM sub_toko_member stm
    WHERE stm.id_sub_toko = chat_rooms.id_sub_toko
      AND stm.id_pengguna = auth.uid()
  ));

-- ===== chat_messages ==========================================================
CREATE POLICY "Pembeli bisa melihat pesan di room miliknya"
  ON public.chat_messages FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id_room = chat_messages.id_room
      AND cr.id_pembeli = auth.uid()
  ));

CREATE POLICY "Pembeli bisa mengirim pesan di room miliknya"
  ON public.chat_messages FOR INSERT TO public
  WITH CHECK (auth.uid() = id_pengirim AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id_room = chat_messages.id_room
      AND cr.id_pembeli = auth.uid()
  ));

CREATE POLICY "Panitia bisa melihat pesan di room sub tokonya"
  ON public.chat_messages FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN sub_toko_member stm ON stm.id_sub_toko = cr.id_sub_toko
    WHERE cr.id_room = chat_messages.id_room
      AND stm.id_pengguna = auth.uid()
  ));

CREATE POLICY "Panitia bisa mengirim pesan di room sub tokonya"
  ON public.chat_messages FOR INSERT TO public
  WITH CHECK (auth.uid() = id_pengirim AND EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN sub_toko_member stm ON stm.id_sub_toko = cr.id_sub_toko
    WHERE cr.id_room = chat_messages.id_room
      AND stm.id_pengguna = auth.uid()
  ));

-- ===== percakapan =============================================================
CREATE POLICY "user see own percakapan"
  ON public.percakapan FOR SELECT TO public
  USING (id_pengguna = auth.uid());

CREATE POLICY "user insert percakapan"
  ON public.percakapan FOR INSERT TO public
  WITH CHECK (id_pengguna = auth.uid());

-- ===== pesan_chat =============================================================
CREATE POLICY "user see own pesan"
  ON public.pesan_chat FOR SELECT TO public
  USING (id_percakapan IN (
    SELECT percakapan.id FROM percakapan
    WHERE percakapan.id_pengguna = auth.uid()
  ));

CREATE POLICY "user insert pesan"
  ON public.pesan_chat FOR INSERT TO public
  WITH CHECK (id_percakapan IN (
    SELECT percakapan.id FROM percakapan
    WHERE percakapan.id_pengguna = auth.uid()
  ));

-- ===== chat_toko ==============================================================
CREATE POLICY "pembeli see own chat"
  ON public.chat_toko FOR SELECT TO public
  USING (id_pembeli = auth.uid());

CREATE POLICY "pembeli insert chat"
  ON public.chat_toko FOR INSERT TO public
  WITH CHECK (id_pembeli = auth.uid());

CREATE POLICY "toko see own chat"
  ON public.chat_toko FOR SELECT TO public
  USING (id_sub_toko IN (
    SELECT sub_toko_member.id_sub_toko FROM sub_toko_member
    WHERE sub_toko_member.id_pengguna = auth.uid()
  ));

-- ===== pesan_toko =============================================================
CREATE POLICY "pembeli see pesan"
  ON public.pesan_toko FOR SELECT TO public
  USING (id_chat IN (
    SELECT chat_toko.id FROM chat_toko
    WHERE chat_toko.id_pembeli = auth.uid()
  ));

CREATE POLICY "pembeli insert pesan"
  ON public.pesan_toko FOR INSERT TO public
  WITH CHECK (id_chat IN (
    SELECT chat_toko.id FROM chat_toko
    WHERE chat_toko.id_pembeli = auth.uid()
  ));

CREATE POLICY "toko see pesan"
  ON public.pesan_toko FOR SELECT TO public
  USING (id_chat IN (
    SELECT ct.id FROM chat_toko ct
    WHERE ct.id_sub_toko IN (
      SELECT sub_toko_member.id_sub_toko FROM sub_toko_member
      WHERE sub_toko_member.id_pengguna = auth.uid()
    )
  ));

CREATE POLICY "toko insert pesan"
  ON public.pesan_toko FOR INSERT TO public
  WITH CHECK (id_chat IN (
    SELECT ct.id FROM chat_toko ct
    WHERE ct.id_sub_toko IN (
      SELECT sub_toko_member.id_sub_toko FROM sub_toko_member
      WHERE sub_toko_member.id_pengguna = auth.uid()
    )
  ));

-- ===== undangan_toko ==========================================================
-- Blocked for all regular users (service role only via backend)
CREATE POLICY "service role only"
  ON public.undangan_toko FOR ALL TO public
  USING (false);

-- ===== undangan_admin =========================================================
-- Blocked for all regular users (service role only via backend)
CREATE POLICY "service role only"
  ON public.undangan_admin FOR ALL TO public
  USING (false);


-- -----------------------------------------------------------------------------
-- SECTION 7: STORAGE BUCKETS
-- -----------------------------------------------------------------------------
-- Note: Storage policies are managed separately in the Supabase Dashboard.
-- These buckets are created as public (unauthenticated read access).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('foto_produk',     'foto_produk',     true, NULL, NULL),
  ('logo_organisasi', 'logo_organisasi', true, NULL, NULL),
  ('profil_pengguna', 'profil_pengguna', true, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Note: 'test' bucket is for development purposes only.
-- Uncomment to include it:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('test', 'test', true) ON CONFLICT (id) DO NOTHING;
