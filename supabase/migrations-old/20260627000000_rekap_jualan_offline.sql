-- Table to track offline sales by proker members
CREATE TABLE rekap_jualan_offline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
    id_member UUID NOT NULL REFERENCES sub_toko_member(id_member) ON DELETE CASCADE,
    id_produk UUID NOT NULL REFERENCES produk(id_produk) ON DELETE RESTRICT,
    jumlah_item INTEGER NOT NULL DEFAULT 1,
    total_harga DECIMAL(12, 2) NOT NULL DEFAULT 0,
    catatan TEXT,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    dicatat_oleh UUID NOT NULL REFERENCES sub_toko_member(id_member) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rekap_offline_sub_toko ON rekap_jualan_offline(id_sub_toko);
CREATE INDEX idx_rekap_offline_member ON rekap_jualan_offline(id_member);
CREATE INDEX idx_rekap_offline_produk ON rekap_jualan_offline(id_produk);
CREATE INDEX idx_rekap_offline_tanggal ON rekap_jualan_offline(tanggal);

-- RLS
ALTER TABLE rekap_jualan_offline ENABLE ROW LEVEL SECURITY;

-- Members of the same sub_toko can read
CREATE POLICY "member can read rekap" ON rekap_jualan_offline
    FOR SELECT
    USING (
        id_sub_toko IN (
            SELECT id_sub_toko FROM sub_toko_member
            WHERE id_pengguna = auth.uid() AND status = 'active'
        )
    );

-- Only KoorPenggalianDana, WakilKoorPenggalianDana, AnggotaPenggalianDana can insert
CREATE POLICY "pengdan can insert rekap" ON rekap_jualan_offline
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sub_toko_member
            WHERE id_pengguna = auth.uid()
              AND id_sub_toko = rekap_jualan_offline.id_sub_toko
              AND status = 'active'
              AND role IN ('KoorPenggalianDana', 'WakilKoorPenggalianDana', 'AnggotaPenggalianDana')
        )
    );

-- Only who recorded it can delete
CREATE POLICY "recorder can delete rekap" ON rekap_jualan_offline
    FOR DELETE
    USING (
        dicatat_oleh IN (
            SELECT id_member FROM sub_toko_member
            WHERE id_pengguna = auth.uid() AND status = 'active'
        )
    );
