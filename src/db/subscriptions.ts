import { getDB } from "./database";
import type { Subscription } from "../types";

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const db = await getDB();
  const all = await db.getAll("subscriptions");
  return all.sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getSubscription(
  id: string,
): Promise<Subscription | undefined> {
  const db = await getDB();
  return db.get("subscriptions", id);
}

export async function putSubscription(sub: Subscription): Promise<void> {
  const db = await getDB();
  await db.put("subscriptions", sub);
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("subscriptions", id);
}
