import { supabase } from "../lib/supabase";
import { dbError } from "../lib/errors";
import type {
  ShowEvent,
  SharedEvent,
  SharedEventPayload,
} from "../types";
import type { SharedEventRow } from "../lib/database.types";

export type ShareResult = "ok" | "not_found" | "self";

/** Build the snapshot payload sent to another user (no ids/subscription data). */
export function buildSharePayload(
  event: ShowEvent,
  senderName: string,
  senderEmail?: string,
): SharedEventPayload {
  return {
    title: event.title,
    category: event.category,
    date: event.date,
    time: event.time,
    venue: event.venue,
    city: event.city,
    seats: event.seats,
    ticketsCount: event.ticketsCount,
    ticketPrice: event.ticketPrice,
    ticketUrl: event.ticketUrl,
    notes: event.notes,
    rating: event.rating,
    review: event.review,
    highlights: event.highlights,
    senderName,
    senderEmail,
  };
}

/** Map a shared snapshot to a fresh event input for the recipient's account. */
export function sharedPayloadToEvent(
  data: SharedEventPayload,
): Omit<ShowEvent, "id" | "createdAt" | "updatedAt"> {
  return {
    title: data.title,
    category: data.category,
    date: data.date,
    time: data.time,
    venue: data.venue,
    city: data.city,
    seats: data.seats,
    ticketsCount: data.ticketsCount,
    ticketPrice: data.ticketPrice,
    ticketUrl: data.ticketUrl,
    notes: data.notes,
    rating: data.rating,
    review: data.review,
    highlights: data.highlights,
  };
}

function fromRow(r: SharedEventRow): SharedEvent {
  return {
    id: r.id,
    senderUserId: r.sender_user_id,
    posterImagePath: r.poster_image_path ?? undefined,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    data: r.shared_event_data as unknown as SharedEventPayload,
  };
}

/**
 * Share an event with a registered user by email. Resolution + insert happen in
 * a SECURITY DEFINER RPC; returns the recipient-lookup outcome.
 */
export async function shareEventWithUser(
  recipientEmail: string,
  payload: SharedEventPayload,
  posterPath: string | null,
  originalEventId: string,
): Promise<ShareResult> {
  const { data, error } = await supabase.rpc("share_event_with_user", {
    p_recipient_email: recipientEmail,
    p_event_data: payload as unknown as Record<string, unknown>,
    p_poster_path: posterPath,
    p_original_event_id: originalEventId,
  });
  if (error) throw dbError(error, "שיתוף האירוע נכשל");
  return (data as ShareResult) ?? "ok";
}

/** Pending shares addressed to the signed-in user (RLS-scoped). */
export async function fetchSharedWithMe(): Promise<SharedEvent[]> {
  const { data, error } = await supabase
    .from("shared_events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw dbError(error, "טעינת השיתופים נכשלה");
  return (data ?? []).map(fromRow);
}

export async function updateShareStatus(
  id: string,
  status: "accepted" | "dismissed",
): Promise<void> {
  const { error } = await supabase
    .from("shared_events")
    .update({ status })
    .eq("id", id);
  if (error) throw dbError(error, "עדכון השיתוף נכשל");
}
