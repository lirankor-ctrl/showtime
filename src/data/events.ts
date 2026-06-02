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
