alter table pesanan add column if not exists alasan_batal text;
alter table pesanan add column if not exists dibatalkan_oleh text check (dibatalkan_oleh in ('pembeli', 'penjual', 'sistem'));
alter table pesanan add column if not exists status_refund text check (status_refund in ('tidak_perlu', 'diproses', 'selesai', 'gagal'));
