-- DDL Schema based on SRS ProkerMart ERD

-- ENUMS
CREATE TYPE user_role AS ENUM ('pembeli', 'organisasi', 'proker', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE active_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE order_status AS ENUM ('menunggu_pembayaran', 'menunggu_konfirmasi', 'diproses', 'siap_diambil', 'selesai', 'dibatalkan');
CREATE TYPE payment_method AS ENUM ('qris', 'transfer', 'tunai');
CREATE TYPE payment_status AS ENUM ('menunggu', 'dibayar', 'gagal');
CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup');

-- 1. Pengguna
CREATE TABLE pengguna (
    id_pengguna UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'pembeli',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Organisasi
CREATE TABLE organisasi (
    id_organisasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE, -- Relasi Mengelola (1:1)
    nama_organisasi VARCHAR(255) NOT NULL,
    nomor_sk VARCHAR(100),
    status_verifikasi verification_status DEFAULT 'pending',
    tgl_daftar TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tgl_verifikasi TIMESTAMP WITH TIME ZONE,
    UNIQUE(id_pengguna)
);

-- 3. Toko
CREATE TABLE toko (
    id_toko UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_organisasi UUID NOT NULL REFERENCES organisasi(id_organisasi) ON DELETE CASCADE, -- Relasi Memiliki (1:1)
    nama_toko VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    logo VARCHAR(255),
    status active_status DEFAULT 'active',
    tgl_dibuat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_organisasi)
);

-- 4. Sub_toko
CREATE TABLE sub_toko (
    id_sub_toko UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_toko UUID NOT NULL REFERENCES toko(id_toko) ON DELETE CASCADE, -- Relasi Menaungi (1:N)
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT, -- Relasi Mengelola (1:1 untuk pengelola proker)
    nama_proker VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    foto_sampul VARCHAR(255),
    metode_jualan VARCHAR(255), -- Bisa JSON array: ["keliling", "pickup"]
    jadwal_operasional TEXT,
    status active_status DEFAULT 'active',
    tgl_dibuat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_pengguna)
);

-- 5. Produk
CREATE TABLE produk (
    id_produk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE, -- Relasi Menjual (1:N)
    nama_produk VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga DECIMAL(12, 2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    foto VARCHAR(255),
    kategori VARCHAR(100),
    status_aktif BOOLEAN DEFAULT TRUE,
    tgl_dibuat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Pesanan
CREATE TABLE pesanan (
    id_pesanan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE RESTRICT, -- Relasi Membuat (1:N)
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE RESTRICT, -- Relasi Menerima (1:N)
    total_harga DECIMAL(12, 2) NOT NULL,
    kode_unik VARCHAR(10) UNIQUE NOT NULL,
    tgl_pesan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tgl_ambil TIMESTAMP WITH TIME ZONE,
    alamat_pengambilan TEXT,
    metode_pengambilan delivery_method NOT NULL,
    status_pesanan order_status DEFAULT 'menunggu_pembayaran'
);

-- 7. Detail_Pesanan
CREATE TABLE detail_pesanan (
    id_detail UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pesanan UUID NOT NULL REFERENCES pesanan(id_pesanan) ON DELETE CASCADE, -- Relasi Terdiri dari (1:N)
    id_produk UUID NOT NULL REFERENCES produk(id_produk) ON DELETE RESTRICT, -- Relasi Tercatat pada (1:N)
    jumlah INT NOT NULL,
    harga_satuan DECIMAL(12, 2) NOT NULL,
    sub_total DECIMAL(12, 2) NOT NULL
);

-- 8. Pembayaran
CREATE TABLE pembayaran (
    id_pembayaran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pesanan UUID NOT NULL REFERENCES pesanan(id_pesanan) ON DELETE CASCADE, -- Relasi Mempunyai (1:1)
    metode_pembayaran payment_method NOT NULL,
    bukti_bayar VARCHAR(255),
    tgl_bayar TIMESTAMP WITH TIME ZONE,
    tgl_konfirmasi TIMESTAMP WITH TIME ZONE,
    status_bayar payment_status DEFAULT 'menunggu',
    catatan TEXT,
    UNIQUE(id_pesanan)
);

-- 9. Notifikasi
CREATE TABLE notifikasi (
    id_notifikasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE, -- Relasi Menerima (1:N)
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    link_terkait VARCHAR(255),
    status_dibaca BOOLEAN DEFAULT FALSE,
    tgl_kirim TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tgl_baca TIMESTAMP WITH TIME ZONE
);

-- RLS (Row Level Security) Templates for Supabase (Optional for full implementation)
-- ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
-- ...
