import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShowEvent, Subscription, SharedEvent } from "../types";
import {
  deleteEventRow,
  fetchEvents,
  insertEvent,
  setArchived,
  setPosterPath,
  updateEvent,
} from "../data/events";
import {
  deleteSubscriptionRow,
  fetchSubscriptions,
  insertSubscription,
  setRemainingTickets,
  updateSubscription,
} from "../data/subscriptions";
import {
  deleteEventPoster,
  deleteStorageForEvent,
  uploadEventPoster,
} from "../data/photos";
import { getSignedImageUrl, getSignedImageUrls } from "../lib/images";
import {
  buildSharePayload,
  fetchSharedWithMe,
  shareEventWithUser,
  sharedPayloadToEvent,
  updateShareStatus,
  type ShareResult,
} from "../data/shares";
import { runDailyReminderCheck } from "../utils/notifications";
import { useAuth } from "./AuthStore";

export interface NewEventInput
  extends Omit<ShowEvent, "id" | "createdAt" | "updatedAt"> {
  id?: string;
}

export interface NewSubscriptionInput
  extends Omit<Subscription, "id" | "createdAt" | "updatedAt"> {
  id?: string;
}

interface AppContextValue {
  events: ShowEvent[];
  subscriptions: Subscription[];
  /** Signed poster URLs keyed by event id (private bucket, refreshed on load). */
  posterUrls: Record<string, string>;
  /** Pending events other users shared with me. */
  sharedWithMe: SharedEvent[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveEvent: (input: NewEventInput) => Promise<string>;
  removeEvent: (id: string) => Promise<void>;
  /** Upload (file) or remove (null) an event's poster image. */
  setEventPoster: (eventId: string, file: File | null) => Promise<void>;
  saveSubscription: (input: NewSubscriptionInput) => Promise<string>;
  removeSubscription: (id: string) => Promise<void>;
  /** Share one of my events with a registered user (by email). */
  shareEvent: (recipientEmail: string, event: ShowEvent) => Promise<ShareResult>;
  /** Save a shared event into my own events (copies the poster too). */
  acceptShare: (share: SharedEvent) => Promise<void>;
  /** Remove a shared event from my "shared with me" list. */
  dismissShare: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, displayName } = useAuth();
  const userId = user?.id ?? null;

  const [events, setEvents] = useState<ShowEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [posterUrls, setPosterUrls] = useState<Record<string, string>>({});
  const [sharedWithMe, setSharedWithMe] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setSubscriptions([]);
      setSharedWithMe([]);
      return;
    }
    const [e, s, shares] = await Promise.all([
      fetchEvents(),
      fetchSubscriptions(),
      fetchSharedWithMe(userId),
    ]);
    setEvents(e);
    setSubscriptions(s);
    setSharedWithMe(shares);
  }, [userId]);

  // (Re)load whenever the signed-in user changes.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await reload();
      } catch {
        if (active) setError("שגיאה בטעינת הנתונים. נסו לרענן.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  // Morning "event today" reminder once data is loaded.
  useEffect(() => {
    if (!loading && events.length > 0) {
      runDailyReminderCheck(events).catch(() => {});
    }
  }, [loading, events]);

  // Refresh signed poster URLs whenever the set of poster paths changes.
  useEffect(() => {
    const entries = events
      .filter((e) => e.posterImagePath)
      .map((e) => [e.id, e.posterImagePath!] as [string, string]);
    if (entries.length === 0) {
      setPosterUrls({});
      return;
    }
    let active = true;
    getSignedImageUrls(entries)
      .then((map) => {
        if (active) setPosterUrls(map);
        if (import.meta.env.DEV) {
          console.debug("[SHOW TIME] poster URLs refreshed:", map);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error("[SHOW TIME] poster URL error:", err);
      });
    return () => {
      active = false;
    };
    // Re-run only when the poster paths themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.map((e) => `${e.id}:${e.posterImagePath ?? ""}`).join("|")]);

  // Keep the in-memory list in the same order the server returns (date asc,
  // then time) so optimistic inserts land in the right place before a reload.
  const sortEvents = (list: ShowEvent[]): ShowEvent[] =>
    [...list].sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""),
    );

  const remainingOf = useCallback(
    (subId: string): number => {
      const s = subscriptions.find((x) => x.id === subId);
      return s?.remainingTickets ?? s?.totalTickets ?? 0;
    },
    [subscriptions],
  );

  const saveEvent = useCallback(
    async (input: NewEventInput): Promise<string> => {
      if (!userId) throw new Error("יש להתחבר כדי לשמור אירועים");
      const prev = input.id ? events.find((e) => e.id === input.id) : undefined;

      const newSubId = input.subscriptionId;
      const newUsed = newSubId ? input.subscriptionTicketsUsed ?? 0 : 0;
      const prevSubId = prev?.subscriptionId;
      const prevUsed = prevSubId ? prev?.subscriptionTicketsUsed ?? 0 : 0;

      // Compute the resulting remaining-ticket counts, validating availability
      // before writing anything. Freeing the previous usage first lets an edit
      // re-use its own tickets.
      const next = new Map<string, number>();
      const cur = (id: string) => (next.has(id) ? next.get(id)! : remainingOf(id));

      if (prevSubId) next.set(prevSubId, cur(prevSubId) + prevUsed);
      if (newSubId) {
        const available = cur(newSubId);
        if (newUsed > available) {
          const name = subscriptions.find((s) => s.id === newSubId)?.name ?? "המנוי";
          throw new Error(
            `אין מספיק כרטיסים ב"${name}". נותרו ${available} כרטיסים בלבד.`,
          );
        }
        next.set(newSubId, available - newUsed);
      }

      const draft = { ...input };
      delete (draft as { id?: string }).id;

      // Persist the event, then the subscription counters.
      const saved = input.id
        ? await updateEvent(input.id, draft)
        : await insertEvent(userId, draft);

      const counterUpdates: Array<[string, number]> = [];
      for (const [subId, remaining] of next) {
        if (remaining !== remainingOf(subId)) {
          await setRemainingTickets(subId, remaining);
          counterUpdates.push([subId, remaining]);
        }
      }

      // Persist the archive flag only when it changes, through its dedicated
      // path (see setArchived). This keeps normal event CRUD from ever touching
      // the column, so it works even before the migration runs.
      let savedEvent = saved;
      const targetArchived = Boolean(input.archived);
      if (targetArchived !== Boolean(prev?.archived)) {
        await setArchived(saved.id, targetArchived);
        savedEvent = { ...saved, archived: targetArchived || undefined };
      }

      // The write has already succeeded — update local state immediately so a
      // transient refresh failure can never report success as failure (which
      // would tempt the user to retry and create a duplicate). The reload then
      // reconciles in the background.
      setEvents((cur) =>
        sortEvents([...cur.filter((e) => e.id !== savedEvent.id), savedEvent]),
      );
      if (counterUpdates.length) {
        setSubscriptions((cur) =>
          cur.map((s) => {
            const u = counterUpdates.find(([sid]) => sid === s.id);
            return u ? { ...s, remainingTickets: u[1] } : s;
          }),
        );
      }
      reload().catch(() => {});
      return saved.id;
    },
    [userId, events, subscriptions, remainingOf, reload],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      const prev = events.find((e) => e.id === id);
      if (prev?.subscriptionId && prev.subscriptionTicketsUsed) {
        // Return the event's tickets to its subscription.
        const remaining = remainingOf(prev.subscriptionId) + prev.subscriptionTicketsUsed;
        await setRemainingTickets(prev.subscriptionId, remaining);
      }
      if (prev?.posterImagePath) {
        await deleteEventPoster(prev.posterImagePath).catch(() => {});
      }
      await deleteStorageForEvent(id); // DB photo rows cascade with the event
      await deleteEventRow(id);
      setEvents((cur) => cur.filter((e) => e.id !== id));
      reload().catch(() => {});
    },
    [events, remainingOf, reload],
  );

  const setEventPoster = useCallback(
    async (eventId: string, file: File | null) => {
      if (!userId) throw new Error("יש להתחבר כדי לעדכן את הכרזה");
      const prev = events.find((e) => e.id === eventId);

      if (file) {
        const path = await uploadEventPoster(userId, eventId, file);
        if (import.meta.env.DEV) console.debug("[SHOW TIME] poster uploaded:", path);
        try {
          const row = await setPosterPath(eventId, path);
          if (import.meta.env.DEV) console.debug("[SHOW TIME] event poster saved:", row);
        } catch (err) {
          // Surface the real cause: upload succeeded but the DB update failed
          // (e.g. the poster_image_path column is missing — run schema.sql).
          console.error("[SHOW TIME] שמירת נתיב הכרזה נכשלה:", err);
          throw err;
        }
        setEvents((cur) =>
          cur.map((e) => (e.id === eventId ? { ...e, posterImagePath: path } : e)),
        );
      } else {
        if (prev?.posterImagePath) {
          await deleteEventPoster(prev.posterImagePath).catch(() => {});
        }
        await setPosterPath(eventId, null);
        setEvents((cur) =>
          cur.map((e) =>
            e.id === eventId ? { ...e, posterImagePath: undefined } : e,
          ),
        );
      }
      reload().catch(() => {});
    },
    [userId, events, reload],
  );

  // ----- In-app sharing between users -----

  const shareEvent = useCallback(
    async (recipientEmail: string, event: ShowEvent): Promise<ShareResult> => {
      if (!userId) throw new Error("יש להתחבר כדי לשתף אירועים");
      const payload = buildSharePayload(
        event,
        displayName || user?.email || "",
        user?.email ?? undefined,
      );
      return shareEventWithUser(
        recipientEmail,
        payload,
        event.posterImagePath ?? null,
        event.id,
      );
    },
    [userId, displayName, user],
  );

  const acceptShare = useCallback(
    async (share: SharedEvent) => {
      // Create the event in my account from the shared snapshot…
      const newId = await saveEvent(sharedPayloadToEvent(share.data));
      // …then copy the poster into my own storage so I fully own it.
      if (share.posterImagePath) {
        try {
          const url = await getSignedImageUrl(share.posterImagePath);
          if (url) {
            const blob = await (await fetch(url)).blob();
            const file = new File([blob], "poster.jpg", {
              type: blob.type || "image/jpeg",
            });
            await setEventPoster(newId, file);
          }
        } catch (err) {
          // The event is already saved; a poster copy failure is non-fatal.
          if (import.meta.env.DEV) console.error("[SHOW TIME] העתקת כרזה נכשלה:", err);
        }
      }
      await updateShareStatus(share.id, "accepted");
      setSharedWithMe((cur) => cur.filter((s) => s.id !== share.id));
    },
    [saveEvent, setEventPoster],
  );

  const dismissShare = useCallback(async (id: string) => {
    await updateShareStatus(id, "dismissed");
    setSharedWithMe((cur) => cur.filter((s) => s.id !== id));
  }, []);

  const saveSubscription = useCallback(
    async (input: NewSubscriptionInput): Promise<string> => {
      if (!userId) throw new Error("יש להתחבר כדי לשמור מנויים");
      const draft = { ...input };
      delete (draft as { id?: string }).id;
      const saved = input.id
        ? await updateSubscription(input.id, draft)
        : await insertSubscription(userId, draft);

      // Reflect the write locally right away (see saveEvent for the rationale).
      setSubscriptions((cur) =>
        [...cur.filter((s) => s.id !== saved.id), saved].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      reload().catch(() => {});
      return saved.id;
    },
    [userId, reload],
  );

  const removeSubscription = useCallback(
    async (id: string) => {
      // Events keep their row; their subscription_id is set null by the FK.
      await deleteSubscriptionRow(id);
      setSubscriptions((cur) => cur.filter((s) => s.id !== id));
      reload().catch(() => {});
    },
    [reload],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      events,
      subscriptions,
      posterUrls,
      sharedWithMe,
      loading,
      error,
      reload,
      saveEvent,
      removeEvent,
      setEventPoster,
      saveSubscription,
      removeSubscription,
      shareEvent,
      acceptShare,
      dismissShare,
    }),
    [
      events,
      subscriptions,
      posterUrls,
      sharedWithMe,
      loading,
      error,
      reload,
      saveEvent,
      removeEvent,
      setEventPoster,
      saveSubscription,
      removeSubscription,
      shareEvent,
      acceptShare,
      dismissShare,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
