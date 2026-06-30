-- 10. Ulasan (Reviews)
CREATE TABLE ulasan (
    id_ulasan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
    id_pesanan UUID REFERENCES pesanan(id_pesanan) ON DELETE SET NULL, -- Opsional, jika review bersumber dari pesanan
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    komentar TEXT,
    tgl_ulasan TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
