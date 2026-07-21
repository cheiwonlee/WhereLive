-- ClearPlate Supabase Schema
-- 실행: Supabase Dashboard → SQL Editor 에 붙여넣고 Run
-- 이미 테이블이 있는 경우엔 아래 ALTER 문만 실행하세요.

-- 1. profiles 테이블
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  gender text check (gender in ('male', 'female')),
  nickname text,
  daily_calorie_target int default 2000,
  created_at timestamptz default now()
);

-- 기존 테이블에 nickname 컬럼 추가 (이미 만든 분들용)
alter table public.profiles add column if not exists nickname text;

-- 2. food_entries 테이블
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  slot text not null check (slot in (
    'breakfast', 'morning_snack', 'lunch', 'afternoon_snack',
    'dinner', 'evening_snack', 'late_night'
  )),
  food_name text not null,
  servings numeric default 1,
  calories numeric default 0,
  carbs numeric default 0,
  protein numeric default 0,
  fat numeric default 0,
  saturated numeric default 0,
  unsaturated numeric default 0,
  poly numeric default 0,
  mono numeric default 0,
  trans numeric default 0,
  cholesterol numeric default 0,
  sodium numeric default 0,
  fiber numeric default 0,
  sugar numeric default 0,
  created_at timestamptz default now()
);

-- 기존 테이블에 unsaturated 컬럼 추가
alter table public.food_entries add column if not exists unsaturated numeric default 0;

create index if not exists idx_food_entries_user_date
  on public.food_entries(user_id, date);

-- 3. RLS 정책
alter table public.profiles enable row level security;
alter table public.food_entries enable row level security;

drop policy if exists "users can view own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "users can delete own profile" on public.profiles;

create policy "users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "users can delete own profile"
  on public.profiles for delete using (auth.uid() = id);

drop policy if exists "users can view own entries" on public.food_entries;
drop policy if exists "users can insert own entries" on public.food_entries;
drop policy if exists "users can update own entries" on public.food_entries;
drop policy if exists "users can delete own entries" on public.food_entries;

create policy "users can view own entries"
  on public.food_entries for select using (auth.uid() = user_id);
create policy "users can insert own entries"
  on public.food_entries for insert with check (auth.uid() = user_id);
create policy "users can update own entries"
  on public.food_entries for update using (auth.uid() = user_id);
create policy "users can delete own entries"
  on public.food_entries for delete using (auth.uid() = user_id);
