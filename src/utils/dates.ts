// Hebrew / Israeli date helpers built on the native Intl API (no deps).

const longFmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortFmt = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthYearFmt = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  year: "numeric",
});

export const HEB_WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

/** Build a local Date from `YYYY-MM-DD` (+ optional `HH:mm`). */
export function toDate(dateStr: string, time?: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }
  return new Date(y, m - 1, d);
}

/** Local `YYYY-MM-DD` for a Date (avoids UTC shift of toISOString). */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function formatLong(dateStr: string): string {
  return longFmt.format(toDate(dateStr));
}

export function formatShort(dateStr: string): string {
  return shortFmt.format(toDate(dateStr));
}

export function formatMonthYear(d: Date): string {
  return monthYearFmt.format(d);
}

export function formatDateTime(dateStr: string, time?: string): string {
  const base = formatLong(dateStr);
  return time ? `${base} · ${time}` : base;
}

/** True when the date string is strictly before today (a past event). */
export function isPast(dateStr: string): boolean {
  return dateStr < todayStr();
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

/** Friendly Hebrew countdown, e.g. "בעוד 3 ימים", "היום", "מחר". */
export function countdownLabel(dateStr: string): string {
  const today = toDate(todayStr());
  const target = toDate(dateStr);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "היום";
  if (days === 1) return "מחר";
  if (days === -1) return "אתמול";
  if (days > 1) return `בעוד ${days} ימים`;
  return `לפני ${Math.abs(days)} ימים`;
}
