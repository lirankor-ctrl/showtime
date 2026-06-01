import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Browser-safe credentials only. These two are the *only* secrets that may
// reach the client; RLS (see supabase/schema.sql) enforces per-user access.
const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** True when real Supabase credentials are configured (not the placeholders). */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.startsWith("your_") && !anonKey.startsWith("your_"),
);

if (!isSupabaseConfigured) {
  // Surfaced in the UI (see ConfigNotice) rather than crashing the app.
  console.warn(
    "[SHOW TIME] Supabase אינו מוגדר. עדכנו את .env.local עם NEXT_PUBLIC_SUPABASE_URL ו-NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

// When unconfigured, hand the client a *valid* dummy URL so construction never
// throws — the UI shows a config notice instead of white-screening.
const safeUrl = isSupabaseConfigured ? (url as string) : "https://placeholder.supabase.co";
const safeKey = isSupabaseConfigured ? (anonKey as string) : "placeholder-anon-key";

export const supabase = createClient<Database>(safeUrl, safeKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const PHOTO_BUCKET = "event-photos";
