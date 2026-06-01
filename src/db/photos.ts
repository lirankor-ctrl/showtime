import { getDB, newId } from "./database";
import type { PhotoRecord } from "../types";

export async function addPhoto(eventId: string, blob: Blob): Promise<string> {
  const db = await getDB();
  const id = newId();
  const record: PhotoRecord = { id, eventId, blob, createdAt: Date.now() };
  await db.put("photos", record);
  return id;
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  return db.get("photos", id);
}

export async function getPhotosForEvent(
  eventId: string,
): Promise<PhotoRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("photos", "byEvent", eventId);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("photos", id);
}

export async function deletePhotosForEvent(eventId: string): Promise<void> {
  const db = await getDB();
  const photos = await db.getAllFromIndex("photos", "byEvent", eventId);
  await Promise.all(photos.map((p) => db.delete("photos", p.id)));
}
