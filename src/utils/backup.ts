// Optional JSON backup/restore (events + subscriptions). Photos live in
// Supabase Storage and are not part of this lightweight backup.
import type { ShowEvent, Subscription } from "../types";
import { insertEvent } from "../data/events";
import { insertSubscription } from "../data/subscriptions";

interface BackupFile {
  app: "show-time";
  version: 2;
  exportedAt: number;
  events: ShowEvent[];
  subscriptions: Subscription[];
}

export function downloadBackup(events: ShowEvent[], subscriptions: Subscription[]): void {
  const data: BackupFile = {
    app: "show-time",
    version: 2,
    exportedAt: Date.now(),
    events,
    subscriptions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `show-time-backup-${new Date(data.exportedAt).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Restore a backup into the signed-in account as new rows. */
export async function restoreBackup(userId: string, raw: unknown): Promise<void> {
  const file = raw as BackupFile;
  if (!file || file.app !== "show-time" || !Array.isArray(file.events)) {
    throw new Error("קובץ הגיבוי אינו תקין");
  }

  const subIdMap = new Map<string, string>();
  for (const s of file.subscriptions ?? []) {
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

  for (const e of file.events) {
    await insertEvent(userId, {
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
  }
}
