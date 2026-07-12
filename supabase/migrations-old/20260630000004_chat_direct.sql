create table if not exists chat_toko (
  id uuid primary key default gen_random_uuid(),
  id_sub_toko uuid not null references sub_toko(id_sub_toko) on delete cascade,
  id_pembeli uuid not null references pengguna(id_pengguna) on delete cascade,
  id_pesanan uuid references pesanan(id_pesanan) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id_sub_toko, id_pembeli)
);

create table if not exists pesan_toko (
  id uuid primary key default gen_random_uuid(),
  id_chat uuid not null references chat_toko(id) on delete cascade,
  id_pengirim uuid not null references pengguna(id_pengguna) on delete cascade,
  isi text not null,
  is_from_toko boolean not null default false,
  created_at timestamptz not null default now()
);

alter table chat_toko enable row level security;
alter table pesan_toko enable row level security;

create policy "pembeli see own chat" on chat_toko for select using (id_pembeli = auth.uid());
create policy "pembeli insert chat" on chat_toko for insert with check (id_pembeli = auth.uid());

create policy "toko see own chat" on chat_toko for select using (
  id_sub_toko in (select id_sub_toko from sub_toko_member where id_pengguna = auth.uid())
);

create policy "pembeli see pesan" on pesan_toko for select using (
  id_chat in (select id from chat_toko where id_pembeli = auth.uid())
);
create policy "toko see pesan" on pesan_toko for select using (
  id_chat in (
    select ct.id from chat_toko ct
    where ct.id_sub_toko in (select id_sub_toko from sub_toko_member where id_pengguna = auth.uid())
  )
);
create policy "pembeli insert pesan" on pesan_toko for insert with check (
  id_chat in (select id from chat_toko where id_pembeli = auth.uid())
);
create policy "toko insert pesan" on pesan_toko for insert with check (
  id_chat in (
    select ct.id from chat_toko ct
    where ct.id_sub_toko in (select id_sub_toko from sub_toko_member where id_pengguna = auth.uid())
  )
);

alter publication supabase_realtime add table chat_toko;
alter publication supabase_realtime add table pesan_toko;
