// Lifecycle helpers for an event. The before/after split is driven by date
// (utils/dates#isPast) AND the explicit `archived` flag set by the post-event
// completion flow: an event becomes a "memory" once its date has passed OR it
// has been archived.
import type { ShowEvent } from "../types";
import { isPast, isToday, toDate } from "./dates";

/** Past-by-date OR explicitly archived — belongs in Memories / past lists. */
export function isMemory(e: ShowEvent): boolean {
  return Boolean(e.archived) || isPast(e.date);
}

/** Still ahead — shown in Upcoming / on the Home hero. */
export function isUpcoming(e: ShowEvent): boolean {
  return !isMemory(e);
}

/** True once the event's start moment has arrived (no time → from midnight). */
export function hasStarted(e: ShowEvent): boolean {
  return Date.now() >= toDate(e.date, e.time).getTime();
}

/**
 * Should we offer the "האירוע הסתיים" completion CTA? Per spec: the event is
 * today, its start time has passed, and it hasn't been archived yet.
 */
export function canComplete(e: ShowEvent): boolean {
  return !e.archived && isToday(e.date) && hasStarted(e);
}
