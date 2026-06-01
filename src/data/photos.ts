import { PHOTO_BUCKET, supabase } from "../lib/supabase";
import type { EventPhotoRow } from "../lib/database.types";

export interface EventPhoto {
  id: string;
  storagePath: string;
  url: string; // short-lived signed URL (private bucket)
}

const SIGNED_TTL = 60 * 60; // 1 hour

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]/g, "_").slice(-60);
}

async function rowsForEvent(eventId: string): Promise<EventPhotoRow[]> {
  const { data, error } = await supabase
    .from("event_photos")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** List an event's photos with fresh signed URLs for display. */
export async function listEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const rows = await rowsForEvent(eventId);
  const out: EventPhoto[] = [];
  for (const row of rows) {
    const { data } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(row.storage_path, SIGNED_TTL);
    out.push({
      id: row.id,
      storagePath: row.storage_path,
      url: data?.signedUrl ?? "",
    });
  }
  return out;
}

/** Upload a file to `<user>/<event>/<file>` and record it in event_photos. */
export async function uploadEventPhoto(
  userId: string,
  eventId: string,
  file: File,
): Promise<void> {
  const path = `${userId}/${eventId}/${crypto.randomUUID()}-${sanitize(file.name || "photo.jpg")}`;
  const up = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (up.error) throw up.error;

  const { error } = await supabase.from("event_photos").insert({
    user_id: userId,
    event_id: eventId,
    storage_path: path,
  });
  if (error) throw error;
}

export async function deleteEventPhoto(
  id: string,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("event_photos").delete().eq("id", id);
  if (error) throw error;
}

/** Remove all storage objects for an event (DB rows cascade with the event). */
export async function deleteStorageForEvent(eventId: string): Promise<void> {
  const rows = await rowsForEvent(eventId);
  if (rows.length === 0) return;
  await supabase.storage.from(PHOTO_BUCKET).remove(rows.map((r) => r.storage_path));
}
