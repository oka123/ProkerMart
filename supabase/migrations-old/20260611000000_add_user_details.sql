-- Menambahkan kolom detail ke tabel pengguna
ALTER TABLE pengguna
ADD COLUMN IF NOT EXISTS no_telepon VARCHAR(20),
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(15),
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
ADD COLUMN IF NOT EXISTS foto_profil VARCHAR(255);

-- Tabel alamat_pengguna
CREATE TABLE IF NOT EXISTS alamat_pengguna (
    id_alamat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    nama_penerima VARCHAR(255) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    provinsi VARCHAR(100) NOT NULL,
    kota VARCHAR(100) NOT NULL,
    kecamatan VARCHAR(100) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    detail_jalan TEXT NOT NULL,
    catatan_tambahan VARCHAR(255),
    is_utama BOOLEAN DEFAULT FALSE,
    tipe_alamat VARCHAR(50) DEFAULT 'Rumah',
    tgl_dibuat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel voucher
CREATE TABLE IF NOT EXISTS voucher (
    id_voucher UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_voucher VARCHAR(50) UNIQUE NOT NULL,
    nama_voucher VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tipe_diskon VARCHAR(50) DEFAULT 'persentase', -- persentase, nominal
    nilai_diskon DECIMAL(12, 2) NOT NULL,
    max_diskon DECIMAL(12, 2),
    min_belanja DECIMAL(12, 2) DEFAULT 0,
    kuota INT DEFAULT 0,
    tgl_mulai TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tgl_berakhir TIMESTAMP WITH TIME ZONE NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    id_toko UUID REFERENCES toko(id_toko) ON DELETE CASCADE -- null jika voucher global platform
);

-- Tabel voucher_pengguna (Voucher yang diklaim/disimpan pengguna)
CREATE TABLE IF NOT EXISTS voucher_pengguna (
    id_klaim UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    id_voucher UUID NOT NULL REFERENCES voucher(id_voucher) ON DELETE CASCADE,
    status_pakai BOOLEAN DEFAULT FALSE,
    tgl_klaim TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tgl_pakai TIMESTAMP WITH TIME ZONE,
    UNIQUE(id_pengguna, id_voucher)
);
