import { getDB } from "./database";
import type { ShowEvent } from "../types";

export async function getAllEvents(): Promise<ShowEvent[]> {
  const db = await getDB();
  const all = await db.getAll("events");
  // Sort by date then time ascending.
  return all.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : (a.time ?? "").localeCompare(b.time ?? "");
  });
}

export async function getEvent(id: string): Promise<ShowEvent | undefined> {
  const db = await getDB();
  return db.get("events", id);
}

export async function putEvent(event: ShowEvent): Promise<void> {
  const db = await getDB();
  await db.put("events", event);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("events", id);
}
