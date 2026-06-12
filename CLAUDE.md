# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SHOW TIME (יומן התרבות שלי) — a Hebrew, RTL, mobile-first PWA for tracking, planning, and remembering cultural events ("אירועים": plays, concerts, movies, etc.). Multi-user, backed by **Supabase** (auth + Postgres + Storage). Each user sees only their own data, enforced by Row Level Security. IndexedDB is no longer the source of truth — it survives only as (a) the source for a one-time migration into Supabase and (b) is unrelated to the optional JSON backup.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # production build to dist/ (esbuild — does NOT type-check)
npm run typecheck  # tsc --noEmit — ALWAYS run this; build skips type-checking
npm run preview    # serve the built dist/ (PWA + service worker active here)
npm run icons      # regenerate public/icons/* from LOGO.jpg
```

No test runner is configured. `tsconfig.json` is `strict` + `noUnusedLocals`/`noUnusedParameters`, so unused imports fail `typecheck` even though `build` passes.

## Supabase setup

1. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor — it creates the tables, RLS policies, the private `event-photos` storage bucket + its policies, indexes, and the `updated_at` / new-user triggers. It is idempotent (safe to re-run).
2. Copy `.env.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API). With placeholders, the app renders a Hebrew "configure Supabase" notice instead of crashing (`isSupabaseConfigured` in `src/lib/supabase.ts`).

### Env var convention (important)

This is a **Vite** app, but the env vars use the **Next.js** `NEXT_PUBLIC_` prefix because that's what the spec/Supabase docs use. `vite.config.ts` sets `envPrefix: ["VITE_", "NEXT_PUBLIC_"]` so Vite exposes them to the client. **Only the URL + anon key may ever use an exposed prefix.** Never introduce a `NEXT_PUBLIC_`/`VITE_` name for the service-role key or any secret — it would be inlined into the browser bundle. Security is enforced by RLS, not by hiding the anon key.

## Architecture

SPA, `HashRouter`. Two React context providers wrap everything (`src/main.tsx`): `AuthProvider` → `AppProvider` → `App`.

- **`src/lib/`** — `supabase.ts` (the single typed client + `PHOTO_BUCKET`) and `database.types.ts` (hand-written DB types; **keep in sync with `supabase/schema.sql`**). The Row types MUST be `type` aliases, not `interface`s — interfaces aren't assignable to `Record<string, unknown>`, which makes the typed client silently resolve every query to `never`.
- **`src/store/AuthStore.tsx`** — `useAuth()`: session, `displayName`, sign in/up/out, password reset, and `recovery` (true after a recovery link, which swaps in the reset-password screen). Maps Supabase's English auth errors to Hebrew via `translateAuthError`.
- **`src/store/AppStore.tsx`** — `useApp()`: the in-memory cache of the signed-in user's events + subscriptions, plus all mutations. Reloads when the user changes. **All writes go through here**, because this is where subscription ticket accounting lives.
- **`src/data/`** — thin Supabase queries per table (`events`, `subscriptions`, `photos`) + `mappers.ts`. Pages/components never call `src/data` or `supabase` directly except `PhotoGallery` (Storage).
- **`src/pages/` / `src/components/` / `src/utils/`** — UI, helpers (Hebrew dates, categories/colors, share, notifications, migration, backup).

### Domain ↔ DB mapping (`src/data/mappers.ts`)

The app's camelCase domain types (`ShowEvent`, `Subscription` in `src/types.ts`) are deliberately kept stable so pages didn't need rewriting; mappers translate to/from the snake_case rows. Non-obvious mappings: `notes`→`pre_notes`, `review`→`post_notes`, `venue`→`organization` (subscriptions), `time`↔`event_time` (DB returns `HH:mm:ss`, UI wants `HH:mm`). Schema note: `events.highlights text[]` was **added** beyond the spec's column list to preserve the existing highlights feature.

### Two cross-cutting rules to preserve

1. **Subscription ticket accounting** lives in `AppStore.saveEvent`/`removeEvent`. It frees the previous version's `subscription_tickets_used` then re-applies the new usage, **validates availability before writing** (throws a Hebrew "אין מספיק כרטיסים…" error the forms display), and updates `remaining_tickets` via `setRemainingTickets`. It is client-side (single-user, RLS-protected) — if you add an event write path, route it through the store or replicate this, or counts drift.

2. **Before/after-event split** is driven by `utils/eventStatus.ts` (`isUpcoming`/`isMemory`/`canComplete`), which combines `utils/dates.ts#isPast` with the explicit `events.archived` flag: an event becomes a memory once its date passes **or** it is archived via the post-event completion flow (`/events/:id/complete`). Future events show planning fields; memories unlock rating/review/highlights/photos. Home hero = soonest upcoming event; Memories = memories, newest-first. Like `poster_image_path`, `archived` is excluded from `eventToRow` and persisted via a dedicated `setArchived` path, so normal event CRUD never depends on the column and keeps working before the migration runs.

### Photos

Private Storage bucket `event-photos`, path `user_id/event_id/file` (the first path segment = owner uid is what the storage RLS policies check). The bucket is private, so display uses short-lived **signed URLs** (`listEventPhotos`). `PhotoGallery` is the only component touching Storage. Deleting an event removes its storage objects (`deleteStorageForEvent`) before the row (DB photo rows cascade).

### Migration & backup

`utils/migration.ts` + `components/MigrationPrompt.tsx`: after login, if legacy IndexedDB data exists and the per-user `show-time:migrated:<uid>` flag isn't set, it offers the Hebrew prompt and uploads events/subscriptions/photos, remapping ids. The flag (set on success **and** on decline) prevents duplicates. `utils/backup.ts` is the optional JSON export/import (events + subscriptions only; photos live in Storage).

## Conventions

- Hebrew UI strings are inline (no i18n layer — Hebrew-only).
- Dates stored as `YYYY-MM-DD` (+ optional `HH:mm`); use `utils/dates.ts` (Intl, `he-IL`), never `toISOString()` (UTC-shifts the local date).
- `LOGO.jpg` at repo root is the source asset; `npm run icons` derives `public/icons/*` and copies it to `public/LOGO.jpg`.
