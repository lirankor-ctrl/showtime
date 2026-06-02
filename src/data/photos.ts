import { PHOTO_BUCKET, supabase } from "../lib/supabase";
import { dbError } from "../lib/errors";
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

// ---------------------------------------------------------------------------
// Event poster / cover image (one per event). Stored under
// <user_id>/events/<event_id>/poster/<file>; the path is kept on the event row
// (events.poster_image_path), so there is no separate DB table for it.
// ---------------------------------------------------------------------------

const posterFolder = (userId: string, eventId: string) =>
  `${userId}/events/${eventId}/poster`;

/** Upload (replacing any existing) the poster for an event; returns its path. */
export async function uploadEventPoster(
  userId: string,
  eventId: string,
  file: File,
): Promise<string> {
  // Drop any previous poster files so we never leave orphans behind.
  const folder = posterFolder(userId, eventId);
  const { data: existing } = await supabase.storage.from(PHOTO_BUCKET).list(folder);
  if (existing?.length) {
    await supabase.storage
      .from(PHOTO_BUCKET)
      .remove(existing.map((f) => `${folder}/${f.name}`));
  }

  const path = `${folder}/${crypto.randomUUID()}-${sanitize(file.name || "poster.jpg")}`;
  const up = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
  if (up.error) throw dbError(up.error, "העלאת הכרזה נכשלה");
  return path;
}

/** Delete a poster storage object (no-op for empty paths). */
export async function deleteEventPoster(path: string): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

/** Fresh signed URL for a single poster path (private bucket). */
export async function posterSignedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  return data?.signedUrl ?? "";
}

/** Batch signed URLs for posters, keyed by event id. */
export async function posterSignedUrls(
  entries: Array<[eventId: string, path: string]>,
): Promise<Record<string, string>> {
  if (entries.length === 0) return {};
  const paths = entries.map(([, p]) => p);
  const { data } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_TTL);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  const out: Record<string, string> = {};
  for (const [eventId, path] of entries) {
    const url = byPath.get(path);
    if (url) out[eventId] = url;
  }
  return out;
}

/** All photo event_ids for the signed-in user — powers the statistics counts. */
export async function fetchUserPhotoEventIds(): Promise<string[]> {
  const { data, error } = await supabase.from("event_photos").select("event_id");
  if (error) throw dbError(error, "טעינת התמונות נכשלה");
  return (data ?? [])
    .map((r) => r.event_id)
    .filter((id): id is string => !!id);
}
