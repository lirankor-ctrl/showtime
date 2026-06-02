// Translate between Supabase rows (snake_case) and app domain types (camelCase).
import type {
  EventRow,
  SubscriptionRow,
} from "../lib/database.types";
import type { CategoryId, ShowEvent, Subscription } from "../types";

const ts = (iso: string): number => new Date(iso).getTime();

// Supabase `time` comes back as HH:mm:ss — the UI only wants HH:mm.
const trimTime = (t: string | null): string | undefined =>
  t ? t.slice(0, 5) : undefined;

export function eventFromRow(r: EventRow): ShowEvent {
  return {
    id: r.id,
    title: r.title,
    category: r.category as CategoryId,
    date: r.event_date,
    time: trimTime(r.event_time),
    venue: r.venue ?? undefined,
    city: r.city ?? undefined,
    seats: r.seats ?? undefined,
    ticketsCount: r.tickets_count ?? undefined,
    ticketPrice: r.ticket_price ?? undefined,
    ticketUrl: r.ticket_url ?? undefined,
    notes: r.pre_notes ?? undefined,
    posterImagePath: r.poster_image_path ?? undefined,
    review: r.post_notes ?? undefined,
    rating: r.rating ?? undefined,
    highlights: r.highlights?.length ? r.highlights : undefined,
    subscriptionId: r.subscription_id ?? undefined,
    subscriptionTicketsUsed: r.subscription_tickets_used || undefined,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

/**
 * Domain event → row columns for insert/update (user_id added by caller).
 * `poster_image_path` is intentionally excluded: posters are managed only via
 * the dedicated setPosterPath path, so a regular event save never clobbers them.
 */
export function eventToRow(
  e: Omit<ShowEvent, "id" | "createdAt" | "updatedAt">,
): Omit<
  EventRow,
  "id" | "user_id" | "created_at" | "updated_at" | "poster_image_path"
> {
  return {
    title: e.title,
    category: e.category,
    event_date: e.date,
    event_time: e.time || null,
    venue: e.venue || null,
    city: e.city || null,
    seats: e.seats || null,
    tickets_count: e.ticketsCount ?? null,
    ticket_price: e.ticketPrice ?? null,
    ticket_url: e.ticketUrl || null,
    pre_notes: e.notes || null,
    post_notes: e.review || null,
    rating: e.rating ?? null,
    highlights: e.highlights ?? [],
    subscription_id: e.subscriptionId || null,
    subscription_tickets_used: e.subscriptionTicketsUsed ?? 0,
  };
}

export function subscriptionFromRow(r: SubscriptionRow): Subscription {
  return {
    id: r.id,
    name: r.name,
    venue: r.organization ?? undefined,
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    totalTickets: r.total_tickets,
    remainingTickets: r.remaining_tickets,
    notes: r.notes ?? undefined,
    color: r.color ?? undefined,
    createdAt: ts(r.created_at),
    updatedAt: ts(r.updated_at),
  };
}

export function subscriptionToRow(
  s: Omit<Subscription, "id" | "createdAt" | "updatedAt">,
): Omit<SubscriptionRow, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    name: s.name,
    organization: s.venue || null,
    start_date: s.startDate || null,
    end_date: s.endDate || null,
    total_tickets: s.totalTickets ?? 0,
    remaining_tickets: s.remainingTickets ?? s.totalTickets ?? 0,
    notes: s.notes || null,
    color: s.color || null,
  };
}
