-- ─────────────────────────────────────────────────────────────────────────────
-- FOLIO — Auth Migration
-- Run this entire file in Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop all existing tables cleanly
drop table if exists public.exercises          cascade;
drop table if exists public.workout_sessions   cascade;
drop table if exists public.wellness_checkins  cascade;
drop table if exists public.wellness_goals     cascade;
drop table if exists public.food_logs          cascade;
drop table if exists public.transactions       cascade;
drop table if exists public.journal_entries    cascade;
drop table if exists public.profiles           cascade;

create extension if not exists "uuid-ossp";

-- ── Profiles (auto-created on signup) ────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text,
  full_name    text,
  cal_goal     int default 2000,
  weight_unit  text default 'lbs',
  currency     text default 'USD',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Transactions ──────────────────────────────────────────────────────────────
create table public.transactions (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text check (type in ('income','expense','savings')) not null,
  description text not null,
  amount      numeric(12,2) not null check (amount > 0),
  category    text not null,
  notes       text,
  date        date default current_date,
  created_at  timestamptz default now()
);
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.transactions(user_id, date desc);

-- ── Food logs ─────────────────────────────────────────────────────────────────
create table public.food_logs (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  calories    int not null default 0,
  protein_g   numeric(6,1) default 0,
  carbs_g     numeric(6,1) default 0,
  fat_g       numeric(6,1) default 0,
  meal        text check (meal in ('breakfast','lunch','dinner','snack')) default 'snack',
  notes       text,
  ai_analyzed boolean default false,
  date        date default current_date,
  created_at  timestamptz default now()
);
alter table public.food_logs enable row level security;
create policy "own food_logs" on public.food_logs using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.food_logs(user_id, date desc);

-- ── Wellness goals ────────────────────────────────────────────────────────────
create table public.wellness_goals (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  name        text not null,
  icon        text default '✦',
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
alter table public.wellness_goals enable row level security;
create policy "own wellness_goals" on public.wellness_goals using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Wellness checkins ─────────────────────────────────────────────────────────
create table public.wellness_checkins (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  goal_id     uuid references public.wellness_goals(id) on delete cascade not null,
  date        date default current_date,
  created_at  timestamptz default now(),
  unique (user_id, goal_id, date)
);
alter table public.wellness_checkins enable row level security;
create policy "own wellness_checkins" on public.wellness_checkins using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.wellness_checkins(user_id, date desc);

-- ── Workout sessions ──────────────────────────────────────────────────────────
create table public.workout_sessions (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  name          text not null,
  type          text default 'Strength',
  duration_mins int default 0,
  total_volume  numeric(10,2) default 0,
  notes         text,
  date          date default current_date,
  created_at    timestamptz default now()
);
alter table public.workout_sessions enable row level security;
create policy "own workout_sessions" on public.workout_sessions using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.workout_sessions(user_id, date desc);

-- ── Exercises ─────────────────────────────────────────────────────────────────
create table public.exercises (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  session_id  uuid references public.workout_sessions(id) on delete cascade not null,
  name        text not null,
  sets        int default 0,
  reps        int default 0,
  weight      numeric(8,2) default 0,
  sort_order  int default 0
);
alter table public.exercises enable row level security;
create policy "own exercises" on public.exercises using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Journal entries ───────────────────────────────────────────────────────────
create table public.journal_entries (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  mood        text,
  mood_score  int check (mood_score between 1 and 5),
  gratitude   text,
  intentions  text,
  body        text,
  tags        text[] default '{}',
  date        date default current_date,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
create policy "own journal_entries" on public.journal_entries using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.journal_entries(user_id, date desc);
