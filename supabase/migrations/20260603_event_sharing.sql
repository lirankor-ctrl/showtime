-- ============================================================================
-- SHOW TIME — standalone migration: in-app event sharing
-- ----------------------------------------------------------------------------
-- Safe to run on an existing production database. Idempotent: uses
-- IF NOT EXISTS / DROP ... IF EXISTS / CREATE OR REPLACE throughout, so it can
-- be re-run without error. Contains ONLY the sharing feature, so it can't be
-- blocked by unrelated statements elsewhere.
--
-- Requires the existing tables public.events and the storage bucket
-- 'event-photos' (both created by schema.sql). Run this in the Supabase
-- SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Table
-- ----------------------------------------------------------------------------
create table if not exists public.shared_events (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  original_event_id uuid references public.events (id) on delete set null,
  shared_event_data jsonb not null,
  poster_image_path text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists shared_events_recipient_idx
  on public.shared_events (recipient_user_id, status);
create index if not exists shared_events_sender_idx
  on public.shared_events (sender_user_id);

-- ----------------------------------------------------------------------------
-- 2) Row Level Security
-- ----------------------------------------------------------------------------
alter table public.shared_events enable row level security;

-- Both parties may read the share row; only the recipient acts on it.
drop policy if exists "shared_events_select" on public.shared_events;
create policy "shared_events_select" on public.shared_events
  for select using (
    auth.uid() = recipient_user_id or auth.uid() = sender_user_id
  );

-- Direct inserts must be the sender's own (normal inserts go through the RPC).
drop policy if exists "shared_events_insert_sender" on public.shared_events;
create policy "shared_events_insert_sender" on public.shared_events
  for insert with check (auth.uid() = sender_user_id);

-- Recipient updates only their own row (used to set status).
drop policy if exists "shared_events_update_recipient" on public.shared_events;
create policy "shared_events_update_recipient" on public.shared_events
  for update using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

-- Recipient may delete a share addressed to them.
drop policy if exists "shared_events_delete_recipient" on public.shared_events;
create policy "shared_events_delete_recipient" on public.shared_events
  for delete using (auth.uid() = recipient_user_id);

-- ----------------------------------------------------------------------------
-- 3) RPC: resolve recipient by email + insert the share atomically
--    SECURITY DEFINER so it can read auth.users; sender is pinned to auth.uid().
--    Returns 'ok' | 'not_found' | 'self'. (Dropped first in case a previous
--    attempt created it with a different return type.)
-- ----------------------------------------------------------------------------
drop function if exists public.share_event_with_user(text, jsonb, text, uuid);

create function public.share_event_with_user(
  p_recipient_email text,
  p_event_data jsonb,
  p_poster_path text,
  p_original_event_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
begin
  select id into v_recipient
    from auth.users
   where lower(email) = lower(trim(p_recipient_email))
   limit 1;

  if v_recipient is null then
    return 'not_found';
  end if;
  if v_recipient = auth.uid() then
    return 'self';
  end if;

  insert into public.shared_events (
    sender_user_id, recipient_user_id, original_event_id,
    shared_event_data, poster_image_path, status
  )
  values (
    auth.uid(), v_recipient, p_original_event_id,
    p_event_data, p_poster_path, 'pending'
  );

  return 'ok';
end;
$$;

grant execute on function public.share_event_with_user(text, jsonb, text, uuid)
  to authenticated;

-- ----------------------------------------------------------------------------
-- 4) Storage: let a recipient sign ONLY the poster objects referenced by
--    shares addressed to them. Bucket stays private; no files are copied.
-- ----------------------------------------------------------------------------
drop policy if exists "event_photos_storage_select_shared" on storage.objects;
create policy "event_photos_storage_select_shared" on storage.objects
  for select using (
    bucket_id = 'event-photos'
    and exists (
      select 1 from public.shared_events se
      where se.recipient_user_id = auth.uid()
        and se.poster_image_path = storage.objects.name
    )
  );

-- ----------------------------------------------------------------------------
-- 5) Force PostgREST to reload its schema cache so the new table + RPC are
--    immediately visible to the API (avoids the PGRST205 "schema cache" error).
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
