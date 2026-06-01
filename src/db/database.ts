import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PhotoRecord, ShowEvent, Subscription } from "../types";

interface ShowTimeDB extends DBSchema {
  events: {
    key: string;
    value: ShowEvent;
    indexes: { byDate: string };
  };
  subscriptions: {
    key: string;
    value: Subscription;
  };
  photos: {
    key: string;
    value: PhotoRecord;
    indexes: { byEvent: string };
  };
}

let dbPromise: Promise<IDBPDatabase<ShowTimeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ShowTimeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ShowTimeDB>("show-time", 1, {
      upgrade(db) {
        const events = db.createObjectStore("events", { keyPath: "id" });
        events.createIndex("byDate", "date");

        db.createObjectStore("subscriptions", { keyPath: "id" });

        const photos = db.createObjectStore("photos", { keyPath: "id" });
        photos.createIndex("byEvent", "eventId");
      },
    });
  }
  return dbPromise;
}

/** Short, collision-resistant id without external deps. */
export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}
