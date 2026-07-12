create table if not exists percakapan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text not null check (kategori in ('pembatalan', 'bantuan', 'laporan', 'kendala', 'lainnya')),
  status text not null default 'aktif' check (status in ('aktif', 'selesai')),
  id_pengguna uuid references pengguna(id_pengguna) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pesan_chat (
  id uuid primary key default gen_random_uuid(),
  id_percakapan uuid not null references percakapan(id) on delete cascade,
  id_pengirim uuid references pengguna(id_pengguna) on delete set null,
  isi text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table percakapan enable row level security;
alter table pesan_chat enable row level security;

create policy "user see own percakapan" on percakapan for select using (id_pengguna = auth.uid());
create policy "user insert percakapan" on percakapan for insert with check (id_pengguna = auth.uid());
create policy "user see own pesan" on pesan_chat for select using (
  id_percakapan in (select id from percakapan where id_pengguna = auth.uid())
);
create policy "user insert pesan" on pesan_chat for insert with check (
  id_percakapan in (select id from percakapan where id_pengguna = auth.uid())
);
