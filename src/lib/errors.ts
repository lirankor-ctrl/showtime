// Normalize Supabase / network failures into real Error objects with clear
// Hebrew messages. Supabase returns *plain objects* (not Error instances), so
// callers that do `err instanceof Error` would otherwise swallow the real cause
// and show only a generic message.

interface RawError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Wrap a raw Supabase/fetch error as an Error with a Hebrew message.
 * The original is logged to the console for debugging.
 */
export function dbError(error: unknown, fallback: string): Error {
  const raw = (error ?? {}) as RawError;
  // eslint-disable-next-line no-console
  console.error("[SHOW TIME] שגיאת מסד נתונים:", error);

  const msg = (raw.message || "").toLowerCase();

  if (
    msg.includes("jwt") ||
    msg.includes("expired") ||
    msg.includes("token") ||
    raw.code === "401" ||
    msg.includes("not authenticated")
  ) {
    return new Error("פג תוקף ההתחברות. התחברו מחדש ונסו שוב.");
  }
  if (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("fetch")
  ) {
    return new Error("בעיית תקשורת. בדקו את החיבור לאינטרנט ונסו שוב.");
  }
  if (msg.includes("duplicate") || raw.code === "23505") {
    return new Error("הרשומה כבר קיימת.");
  }
  if (msg.includes("row-level security") || raw.code === "42501") {
    return new Error("אין הרשאה לבצע פעולה זו.");
  }

  return new Error(fallback);
}
