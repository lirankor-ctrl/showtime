import { supabase } from "../lib/supabase";
import { dbError } from "../lib/errors";
import type { ShowEvent } from "../types";
import { eventFromRow, eventToRow } from "./mappers";

type EventDraft = Omit<ShowEvent, "id" | "createdAt" | "updatedAt">;

export async function fetchEvents(): Promise<ShowEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true, nullsFirst: true });
  if (error) throw dbError(error, "טעינת האירועים נכשלה");
  return (data ?? []).map(eventFromRow);
}

export async function insertEvent(
  userId: string,
  draft: EventDraft,
): Promise<ShowEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert({ ...eventToRow(draft), user_id: userId })
    .select("*")
    .single();
  if (error) throw dbError(error, "שמירת האירוע נכשלה");
  return eventFromRow(data);
}

export async function updateEvent(
  id: string,
  draft: EventDraft,
): Promise<ShowEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(eventToRow(draft))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw dbError(error, "שמירת האירוע נכשלה");
  return eventFromRow(data);
}

export async function deleteEventRow(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw dbError(error, "מחיקת האירוע נכשלה");
}

/**
 * Set (or clear) only the poster path on an event row. Uses select().single()
 * so a missing column or a 0-row update (RLS / wrong id) surfaces as an error
 * instead of silently "succeeding". Returns the updated row.
 */
export async function setPosterPath(
  id: string,
  path: string | null,
): Promise<{ id: string; poster_image_path: string | null }> {
  const { data, error } = await supabase
    .from("events")
    .update({ poster_image_path: path })
    .eq("id", id)
    .select("id, poster_image_path")
    .single();
  if (error) throw dbError(error, "עדכון הכרזה נכשל");
  return data;
}

/**
 * Set only the `archived` flag on an event row. Kept separate from the regular
 * save (mirroring setPosterPath) so normal event CRUD never depends on this
 * column existing. select().single() surfaces a missing column / 0-row update
 * as an error instead of silently succeeding.
 */
export async function setArchived(
  id: string,
  archived: boolean,
): Promise<{ id: string; archived: boolean }> {
  const { data, error } = await supabase
    .from("events")
    .update({ archived })
    .eq("id", id)
    .select("id, archived")
    .single();
  if (error) throw dbError(error, "העברת האירוע לארכיון נכשלה");
  return data;
}
