-- Macro Tracker initial schema.
-- Every table is owned by a user and protected by row-level security (user_id = auth.uid()).

-- ---------- enums ----------
create type public.sex as enum ('male', 'female');
create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type public.unit_system as enum ('imperial', 'metric');
create type public.goal_type as enum ('cut', 'fat_loss', 'maintain', 'lean_bulk', 'muscle_gain');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.meal_source as enum ('manual', 'usda', 'text_ai', 'photo_ai', 'saved');

-- ---------- profiles ----------
create table public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  sex            public.sex,
  birth_date     date,
  height_cm      numeric(5, 1) check (height_cm between 50 and 275),
  activity_level public.activity_level not null default 'moderate',
  units          public.unit_system not null default 'imperial',
  timezone       text not null default 'America/New_York',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- goals ----------
create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        public.goal_type not null,
  kcal        integer not null check (kcal between 800 and 8000),
  protein_g   integer not null check (protein_g >= 0),
  carbs_g     integer not null check (carbs_g >= 0),
  fat_g       integer not null check (fat_g >= 0),
  is_override boolean not null default false,
  start_date  date not null default current_date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
-- Only one active goal per user.
create unique index goals_one_active_per_user on public.goals (user_id) where active;

-- ---------- meals ----------
create table public.meals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_at      timestamptz not null default now(),
  -- Local calendar date the meal counts toward (set by the app using the user's timezone).
  eaten_on      date not null default current_date,
  meal_type     public.meal_type not null,
  name          text not null check (char_length(name) between 1 and 200),
  source        public.meal_source not null default 'manual',
  photo_path    text,
  ai_confidence numeric(3, 2) check (ai_confidence between 0 and 1),
  notes         text,
  created_at    timestamptz not null default now()
);
create index meals_user_day on public.meals (user_id, eaten_on);

create table public.meal_items (
  id         uuid primary key default gen_random_uuid(),
  meal_id    uuid not null references public.meals (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 200),
  quantity   numeric(8, 2) not null default 1 check (quantity > 0),
  unit       text not null default 'serving',
  kcal       numeric(7, 1) not null default 0 check (kcal >= 0),
  protein_g  numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g    numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g      numeric(6, 1) not null default 0 check (fat_g >= 0),
  fiber_g    numeric(6, 1) check (fiber_g >= 0),
  usda_fdc_id integer,
  created_at timestamptz not null default now()
);
create index meal_items_meal on public.meal_items (meal_id);

-- ---------- saved foods (favorites / recipes) ----------
create table public.saved_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 200),
  serving     text not null default '1 serving',
  kcal        numeric(7, 1) not null default 0 check (kcal >= 0),
  protein_g   numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g     numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g       numeric(6, 1) not null default 0 check (fat_g >= 0),
  fiber_g     numeric(6, 1) check (fiber_g >= 0),
  times_used  integer not null default 0,
  last_used_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- weigh-ins ----------
create table public.weigh_ins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null default current_date,
  weight_kg  numeric(5, 2) not null check (weight_kg between 20 and 400),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---------- AI usage (per-day rate limit / cost guard) ----------
create table public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint   text not null,
  model      text not null,
  input_tokens  integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);
create index ai_usage_user_time on public.ai_usage (user_id, created_at);

-- ---------- daily totals view ----------
create view public.daily_totals
with (security_invoker = true) as
select
  m.user_id,
  m.eaten_on as day,
  count(distinct m.id)            as meals,
  coalesce(sum(i.kcal), 0)        as kcal,
  coalesce(sum(i.protein_g), 0)   as protein_g,
  coalesce(sum(i.carbs_g), 0)     as carbs_g,
  coalesce(sum(i.fat_g), 0)       as fat_g,
  coalesce(sum(i.fiber_g), 0)     as fiber_g
from public.meals m
left join public.meal_items i on i.meal_id = m.id
group by m.user_id, m.eaten_on;

-- ---------- row-level security ----------
alter table public.profiles    enable row level security;
alter table public.goals       enable row level security;
alter table public.meals       enable row level security;
alter table public.meal_items  enable row level security;
alter table public.saved_foods enable row level security;
alter table public.weigh_ins   enable row level security;
alter table public.ai_usage    enable row level security;

create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own goals" on public.goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own meals" on public.meals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own meal items" on public.meal_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
  );
create policy "own saved foods" on public.saved_foods for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own weigh-ins" on public.weigh_ins for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- ai_usage: users can read their own usage; inserts happen server-side as the user.
create policy "read own ai usage" on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own ai usage" on public.ai_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ---------- auto-create profile on sign-up ----------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profiles.updated_at fresh
create function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- storage: private bucket for meal photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Photos are stored under "<user_id>/<file>", and users can only touch their own folder.
create policy "own meal photos read" on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own meal photos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own meal photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
