import type { ShowEvent } from "../types";
import { category } from "./categories";
import { formatDateTime, isPast } from "./dates";

/** Build a clean Hebrew text summary of an event for sharing. */
export function buildShareText(event: ShowEvent): string {
  const lines: string[] = [];
  const cat = category(event.category);
  lines.push(`🎟️ ${event.title}`);
  lines.push(`${cat.icon} קטגוריה: ${cat.label}`);
  lines.push(`📅 ${formatDateTime(event.date, event.time)}`);

  const place = [event.venue, event.city].filter(Boolean).join(", ");
  if (place) lines.push(`📍 ${place}`);
  if (event.seats) lines.push(`💺 ${event.seats}`);

  if (isPast(event.date)) {
    if (event.rating) lines.push(`⭐ דירוג: ${"★".repeat(event.rating)}`);
    if (event.review) lines.push(`📝 ${event.review}`);
  } else if (event.notes) {
    lines.push(`📝 ${event.notes}`);
  }

  lines.push("");
  lines.push("נשלח מ־SHOW TIME · יומן התרבות שלי");
  return lines.join("\n");
}

export type ShareResult = "shared" | "copied" | "failed";

/**
 * Share an event using the native Web Share API when available,
 * falling back to copying the Hebrew summary to the clipboard.
 */
export async function shareEvent(event: ShowEvent): Promise<ShareResult> {
  const text = buildShareText(event);
  if (navigator.share) {
    try {
      await navigator.share({ title: event.title, text });
      return "shared";
    } catch (err) {
      // User cancelled the native sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "failed";
      }
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
