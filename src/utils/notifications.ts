import type { ShowEvent } from "../types";
import { todayStr } from "./dates";

/*
 * LOCAL NOTIFICATIONS — what is and isn't possible without a backend.
 *
 * Supported locally (no server):
 *  - Requesting Notification permission.
 *  - Showing a notification *while a tab/PWA is open* via the Notification API
 *    or the service worker's registration.showNotification().
 *  - A "morning reminder" check that runs whenever the app is opened and fires
 *    a notification for any event happening today (deduped per day).
 *
 * NOT possible without a backend:
 *  - True scheduled push when the app is fully closed. Web Push requires a
 *    server with VAPID keys to deliver messages via the browser's push service.
 *    The Notification Triggers API (timestamp-scheduled notifications) is not
 *    yet broadly available. So a guaranteed 8:00am push when the app is closed
 *    needs a server — out of scope for this local-only stage.
 */

const LAST_REMINDER_KEY = "show-time:last-reminder-date";

export function notificationsSupported(): boolean {
  return "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

async function show(title: string, body: string): Promise<void> {
  const options: NotificationOptions = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    dir: "rtl",
    lang: "he",
  };
  // Prefer the service worker registration so notifications behave like a PWA.
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  }
  new Notification(title, options);
}

/**
 * Fire a "you have an event today" reminder when the app opens, at most once
 * per calendar day. Call this on app start after data has loaded.
 */
export async function runDailyReminderCheck(events: ShowEvent[]): Promise<void> {
  if (notificationPermission() !== "granted") return;

  const today = todayStr();
  if (localStorage.getItem(LAST_REMINDER_KEY) === today) return;

  const todays = events.filter((e) => e.date === today);
  if (todays.length === 0) return;

  localStorage.setItem(LAST_REMINDER_KEY, today);
  const title = todays.length === 1 ? "יש לך אירוע היום! 🎭" : `יש לך ${todays.length} אירועים היום! 🎭`;
  const body =
    todays.length === 1
      ? `${todays[0].title}${todays[0].time ? ` · ${todays[0].time}` : ""}`
      : todays.map((e) => e.title).join(" · ");
  await show(title, body);
}

/** Send an immediate test notification so the user can confirm it works. */
export async function sendTestNotification(): Promise<void> {
  await show("SHOW TIME", "התראות פעילות 🎉 כאן תקבלו תזכורות על אירועים.");
}
