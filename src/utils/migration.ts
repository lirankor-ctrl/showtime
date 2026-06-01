// One-time migration of legacy local (IndexedDB) data into the user's Supabase
// account. Guarded per-user so it never runs twice / duplicates events.
import { getAllEvents as localEvents } from "../db/events";
import { getAllSubscriptions as localSubs } from "../db/subscriptions";
import { getPhotosForEvent as localPhotos } from "../db/photos";
import { insertEvent } from "../data/events";
import { insertSubscription } from "../data/subscriptions";
import { uploadEventPhoto } from "../data/photos";

const flagKey = (userId: string) => `show-time:migrated:${userId}`;

export function migrationDone(userId: string): boolean {
  return localStorage.getItem(flagKey(userId)) === "1";
}

export function markMigrated(userId: string): void {
  localStorage.setItem(flagKey(userId), "1");
}

/** Is there legacy local data worth offering to migrate? */
export async function hasLocalData(): Promise<boolean> {
  try {
    const [e, s] = await Promise.all([localEvents(), localSubs()]);
    return e.length > 0 || s.length > 0;
  } catch {
    return false;
  }
}

export interface MigrationResult {
  events: number;
  subscriptions: number;
  photos: number;
}

export async function runMigration(userId: string): Promise<MigrationResult> {
  const [events, subs] = await Promise.all([localEvents(), localSubs()]);

  // Subscriptions first, so events can reference the new ids.
  const subIdMap = new Map<string, string>();
  for (const s of subs) {
    const created = await insertSubscription(userId, {
      name: s.name,
      venue: s.venue,
      startDate: s.startDate,
      endDate: s.endDate,
      totalTickets: s.totalTickets ?? 0,
      remainingTickets: s.remainingTickets ?? s.totalTickets ?? 0,
      notes: s.notes,
      color: s.color,
    });
    subIdMap.set(s.id, created.id);
  }

  let photoCount = 0;
  for (const e of events) {
    const created = await insertEvent(userId, {
      title: e.title,
      category: e.category,
      date: e.date,
      time: e.time,
      venue: e.venue,
      city: e.city,
      seats: e.seats,
      ticketsCount: e.ticketsCount,
      ticketPrice: e.ticketPrice,
      ticketUrl: e.ticketUrl,
      notes: e.notes,
      review: e.review,
      rating: e.rating,
      highlights: e.highlights,
      subscriptionId: e.subscriptionId ? subIdMap.get(e.subscriptionId) : undefined,
      subscriptionTicketsUsed: e.subscriptionTicketsUsed,
    });

    // Move any locally-stored photo blobs into Supabase Storage.
    const photos = await localPhotos(e.id);
    for (const p of photos) {
      const file = new File([p.blob], "photo.jpg", {
        type: p.blob.type || "image/jpeg",
      });
      await uploadEventPhoto(userId, created.id, file);
      photoCount++;
    }
  }

  markMigrated(userId);
  return { events: events.length, subscriptions: subs.length, photos: photoCount };
}
