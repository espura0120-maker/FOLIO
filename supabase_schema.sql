-- Run this entire file in Supabase → SQL Editor → New query → Run

create extension if not exists "uuid-ossp";

-- Transactions
create table if not exists public.transactions (
  id          uuid default uuid_generate_v4() primary key,
  type        text check (type in ('income','expense','savings')) not null,
  description text not null,
  amount      numeric(12,2) not null check (amount > 0),
  category    text not null,
  notes       text,
  date        date default current_date,
  created_at  timestamptz default now()
);

-- Food logs
create table if not exists public.food_logs (
  id          uuid default uuid_generate_v4() primary key,
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

-- Wellness goals
create table if not exists public.wellness_goals (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  icon        text default '✦',
  sort_order  int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Insert default goals
insert into public.wellness_goals (name, icon, sort_order) values
  ('Drink 8 glasses of water', '💧', 0),
  ('Walk 10,000 steps',        '🏃', 1),
  ('Meditate 10 minutes',      '🧘', 2),
  ('Sleep 8 hours',            '😴', 3),
  ('Read 20 pages',            '📚', 4);

-- Wellness checkins
create table if not exists public.wellness_checkins (
  id          uuid default uuid_generate_v4() primary key,
  goal_id     uuid references public.wellness_goals(id) on delete cascade not null,
  date        date default current_date,
  created_at  timestamptz default now(),
  unique (goal_id, date)
);

-- Workout sessions
create table if not exists public.workout_sessions (
  id            uuid default uuid_generate_v4() primary key,
  name          text not null,
  type          text default 'Strength',
  duration_mins int default 0,
  total_volume  numeric(10,2) default 0,
  notes         text,
  date          date default current_date,
  created_at    timestamptz default now()
);

-- Exercises
create table if not exists public.exercises (
  id          uuid default uuid_generate_v4() primary key,
  session_id  uuid references public.workout_sessions(id) on delete cascade not null,
  name        text not null,
  sets        int default 0,
  reps        int default 0,
  weight      numeric(8,2) default 0,
  sort_order  int default 0
);

-- Journal entries
create table if not exists public.journal_entries (
  id          uuid default uuid_generate_v4() primary key,
  mood        text,
  mood_score  int check (mood_score between 1 and 5),
  gratitude   text,
  intentions  text,
  body        text,
  tags        text[] default '{}',
  date        date default current_date,
  created_at  timestamptz default now()
);
