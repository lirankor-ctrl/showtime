import type { Subscription } from "../types";
import { toDate, todayStr } from "./dates";

const LOW_TICKETS = 2;
const ENDING_DAYS = 14;

export interface SubWarning {
  level: "warn" | "info";
  text: string;
}

/** Warnings shown when a subscription is nearly used up or about to expire. */
export function subscriptionWarnings(sub: Subscription): SubWarning[] {
  const out: SubWarning[] = [];

  if (sub.remainingTickets !== undefined && sub.remainingTickets <= LOW_TICKETS) {
    out.push({
      level: "warn",
      text:
        sub.remainingTickets <= 0
          ? "לא נותרו כרטיסים במנוי"
          : `נותרו רק ${sub.remainingTickets} כרטיסים`,
    });
  }

  if (sub.endDate) {
    const today = toDate(todayStr());
    const end = toDate(sub.endDate);
    const days = Math.round((end.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) {
      out.push({ level: "warn", text: "תוקף המנוי פג" });
    } else if (days <= ENDING_DAYS) {
      out.push({
        level: "warn",
        text: days === 0 ? "המנוי מסתיים היום" : `המנוי מסתיים בעוד ${days} ימים`,
      });
    }
  }

  return out;
}

export function usedPercent(sub: Subscription): number {
  if (!sub.totalTickets) return 0;
  const remaining = sub.remainingTickets ?? sub.totalTickets;
  const used = sub.totalTickets - remaining;
  return Math.max(0, Math.min(100, Math.round((used / sub.totalTickets) * 100)));
}
