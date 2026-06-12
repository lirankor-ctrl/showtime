-- ============================================================================
-- SHOW TIME — standalone migration: event completion + event discovery
-- ----------------------------------------------------------------------------
-- Safe to run on an existing production database. Idempotent: uses
-- IF NOT EXISTS / DROP ... IF EXISTS / ON CONFLICT DO NOTHING throughout, so it
-- can be re-run without error. Contains ONLY these two features, so it can't be
-- blocked by unrelated statements elsewhere.
--
-- Requires the existing table public.events (created by schema.sql).
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Event completion flag
--    An event becomes a "memory" either when its date passes OR when the user
--    explicitly archives it via the post-event flow.
-- ----------------------------------------------------------------------------
alter table public.events
  add column if not exists archived boolean not null default false;

-- ----------------------------------------------------------------------------
-- 2) Event discovery — curated external booking sites, grouped by category.
--    Shared reference data (NOT per-user). Read-only via RLS; managed by SQL /
--    the service role so an admin UI can be added later with no schema change.
-- ----------------------------------------------------------------------------
create table if not exists public.external_links (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  url text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category, title)
);

create index if not exists external_links_category_idx
  on public.external_links (category, sort_order);

alter table public.external_links enable row level security;

drop policy if exists "external_links_select_all" on public.external_links;
create policy "external_links_select_all" on public.external_links
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 3) Seed the catalogue (idempotent via the (category, title) unique key).
--    URLs can be edited later directly in SQL without touching app code.
-- ----------------------------------------------------------------------------
insert into public.external_links (category, title, description, url, sort_order) values
  -- הצגות
  ('theater', 'הבימה', 'התיאטרון הלאומי', 'https://www.habima.co.il', 1),
  ('theater', 'הקאמרי', 'תיאטרון הקאמרי תל אביב', 'https://www.cameri.co.il', 2),
  ('theater', 'בית ליסין', 'תיאטרון בית ליסין', 'https://www.lessin.co.il', 3),
  ('theater', 'גשר', 'תיאטרון גשר', 'https://www.gesher-theatre.co.il', 4),
  ('theater', 'תיאטרון חיפה', 'התיאטרון העירוני חיפה', 'https://www.ht1.co.il', 5),
  -- הופעות
  ('shows', 'זאפה', 'מועדוני זאפה', 'https://www.zappa-club.co.il', 1),
  ('shows', 'לאן', 'הזמנת כרטיסים להופעות', 'https://www.leaan.co.il', 2),
  ('shows', 'בראבו', 'כרטיסים להופעות ומופעים', 'https://www.bravo.co.il', 3),
  ('shows', 'Eventim', 'כרטיסים למגוון אירועים', 'https://www.eventim.co.il', 4),
  -- קונצרטים
  ('concerts', 'הפילהרמונית', 'התזמורת הפילהרמונית הישראלית', 'https://www.ipo.co.il', 1),
  ('concerts', 'האופרה', 'האופרה הישראלית', 'https://www.israel-opera.co.il', 2),
  ('concerts', 'היכל התרבות', 'היכל מאנגו תל אביב', 'https://www.hatarbut.co.il', 3),
  -- סרטים
  ('movies', 'סינמה סיטי', 'רשת בתי הקולנוע', 'https://www.cinema-city.co.il', 1),
  ('movies', 'יס פלאנט', 'רשת בתי הקולנוע', 'https://www.yesplanet.co.il', 2),
  ('movies', 'רב חן', 'רשת בתי הקולנוע', 'https://www.rav-hen.co.il', 3),
  ('movies', 'לב', 'בתי הקולנוע לב', 'https://www.lev.co.il', 4),
  -- סטנדאפ
  ('standup', 'קומדי בר', 'מועדון הסטנדאפ', 'https://www.comedybar.co.il', 1),
  ('standup', 'Eventim', 'מופעי סטנדאפ', 'https://www.eventim.co.il', 2),
  -- פסטיבלים
  ('festivals', 'פסטיבל ישראל', 'פסטיבל ישראל ירושלים', 'https://www.israel-festival.org', 1),
  ('festivals', 'Eventim', 'פסטיבלים ואירועים', 'https://www.eventim.co.il', 2),
  -- הרצאות
  ('lectures', 'בית אבי חי', 'הרצאות ואירועי תרבות', 'https://www.bac.org.il', 1),
  ('lectures', 'Eventim', 'הרצאות ואירועי תרבות', 'https://www.eventim.co.il', 2),
  -- לכל המשפחה
  ('family', 'Eventim', 'מופעים לכל המשפחה', 'https://www.eventim.co.il', 1),
  ('family', 'בראבו', 'הצגות ומופעי ילדים', 'https://www.bravo.co.il', 2),
  -- ספורט
  ('sports', 'Eventim', 'כרטיסים לאירועי ספורט', 'https://www.eventim.co.il', 1)
on conflict (category, title) do nothing;
