create table if not exists penarikan_saldo (
  id uuid primary key default gen_random_uuid(),
  id_sub_toko uuid not null references sub_toko(id_sub_toko) on delete cascade,
  jumlah numeric(15,2) not null check (jumlah > 0),
  nama_bank text not null,
  no_rekening text not null,
  nama_pemilik text not null,
  catatan text,
  tgl_tarik timestamptz not null default now()
);

alter table penarikan_saldo enable row level security;

create policy "proker can manage own penarikan"
  on penarikan_saldo for all
  using (
    id_sub_toko in (
      select id_sub_toko from sub_toko_member
      where id_pengguna = auth.uid()
    )
  );
