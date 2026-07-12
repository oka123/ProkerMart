-- Track which sub_toko_member handled/processed each online order
ALTER TABLE pesanan ADD COLUMN dicatat_oleh UUID REFERENCES sub_toko_member(id_member) ON DELETE SET NULL;

CREATE INDEX idx_pesanan_dicatat_oleh ON pesanan(dicatat_oleh);
