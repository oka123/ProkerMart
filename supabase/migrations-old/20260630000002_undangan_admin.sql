create table if not exists undangan_admin (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now()
);
alter table undangan_admin enable row level security;
create policy "service role only" on undangan_admin for all using (false);
