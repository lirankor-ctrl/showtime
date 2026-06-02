-- ============================================================================
-- SHOW TIME — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / idempotent policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  organization text,
  start_date date,
  end_date date,
  total_tickets int not null default 0,
  remaining_tickets int not null default 0,
  notes text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null,
  event_date date not null,
  event_time time,
  venue text,
  city text,
  seats text,
  tickets_count int default 1,
  ticket_price numeric,
  ticket_url text,
  pre_notes text,
  post_notes text,
  rating int check (rating between 1 and 5),
  highlights text[] not null default '{}',
  subscription_id uuid references public.subscriptions (id) on delete set null,
  subscription_tickets_used int not null default 0,
  poster_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Poster/cover image per event (added beyond the original spec). Idempotent so
-- existing databases pick it up on a re-run.
alter table public.events
  add column if not exists poster_image_path text;

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes (lookups are always scoped per user / per event)
-- ----------------------------------------------------------------------------

create index if not exists events_user_date_idx on public.events (user_id, event_date);
create index if not exists events_subscription_idx on public.events (subscription_id);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists event_photos_event_idx on public.event_photos (event_id);
create index if not exists event_photos_user_idx on public.event_photos (user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security — every user sees ONLY their own rows
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;

-- profiles: keyed by the user's own id
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- subscriptions
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (auth.uid() = user_id);

-- events
drop policy if exists "events_select_own" on public.events;
create policy "events_select_own" on public.events
  for select using (auth.uid() = user_id);

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events
  for delete using (auth.uid() = user_id);

-- event_photos
drop policy if exists "event_photos_select_own" on public.event_photos;
create policy "event_photos_select_own" on public.event_photos
  for select using (auth.uid() = user_id);

drop policy if exists "event_photos_insert_own" on public.event_photos;
create policy "event_photos_insert_own" on public.event_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "event_photos_update_own" on public.event_photos;
create policy "event_photos_update_own" on public.event_photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "event_photos_delete_own" on public.event_photos;
create policy "event_photos_delete_own" on public.event_photos
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Storage — private bucket for event photos
-- Path convention: <user_id>/<event_id>/<file-name>
-- so (storage.foldername(name))[1] is always the owner's uid.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;

drop policy if exists "event_photos_storage_select" on storage.objects;
create policy "event_photos_storage_select" on storage.objects
  for select using (
    bucket_id = 'event-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event_photos_storage_insert" on storage.objects;
create policy "event_photos_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'event-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event_photos_storage_update" on storage.objects;
create policy "event_photos_storage_update" on storage.objects
  for update using (
    bucket_id = 'event-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event_photos_storage_delete" on storage.objects;
create policy "event_photos_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'event-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
