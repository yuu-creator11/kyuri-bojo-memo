-- =====================================================================
-- キュウリ防除メモ — Supabaseセットアップ用SQL
-- Supabase Dashboard > SQL Editor に貼り付けて実行してください
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ── 圃場 (fields) ──────────────────────────────────────────
create table if not exists fields (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 作期 (seasons) ──────────────────────────────────────────
create table if not exists seasons (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  start_date date,
  end_date   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 農薬 (pesticides) ──────────────────────────────────────
create table if not exists pesticides (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  name                      text not null,
  registration_number       text,
  max_uses_per_season       integer not null default 5,
  pre_harvest_interval_days integer,
  memo                      text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ── 散布記録 (spray_records) ────────────────────────────────
create table if not exists spray_records (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  field_id     uuid not null references fields(id)     on delete cascade,
  season_id    uuid not null references seasons(id)    on delete cascade,
  pesticide_id uuid not null references pesticides(id) on delete cascade,
  sprayed_at   date not null default current_date,
  amount       text,
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── updated_at 自動更新トリガー ─────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger fields_updated_at
  before update on fields for each row execute function set_updated_at();
create trigger seasons_updated_at
  before update on seasons for each row execute function set_updated_at();
create trigger pesticides_updated_at
  before update on pesticides for each row execute function set_updated_at();
create trigger spray_records_updated_at
  before update on spray_records for each row execute function set_updated_at();

-- ── Row Level Security (RLS) ────────────────────────────────
alter table fields        enable row level security;
alter table seasons       enable row level security;
alter table pesticides    enable row level security;
alter table spray_records enable row level security;

-- 自分のデータだけ操作できるポリシー
create policy "fields: own data" on fields
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "seasons: own data" on seasons
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pesticides: own data" on pesticides
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "spray_records: own data" on spray_records
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── インデックス ────────────────────────────────────────────
create index if not exists idx_spray_composite
  on spray_records(user_id, field_id, season_id, pesticide_id);
create index if not exists idx_spray_date
  on spray_records(user_id, sprayed_at desc);
