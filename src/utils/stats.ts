// Derive cultural-activity insights from the user's events & subscriptions.
import type { ShowEvent, Subscription } from "../types";
import { CATEGORIES, category } from "./categories";
import { isPast, todayStr } from "./dates";

export interface CategoryStat {
  id: string;
  label: string;
  icon: string;
  color: string;
  count: number;
}

export interface MonthStat {
  month: number; // 0-11
  label: string;
  count: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  current: number;
  target: number;
}

export interface Stats {
  totalEvents: number;
  totalAttended: number;
  thisYear: number;
  thisMonth: number;
  avgRating: number | null;
  totalPhotos: number;
  activeSubscriptions: number;
  categoriesExperienced: number;

  categoryBreakdown: CategoryStat[];

  topRated: ShowEvent | null;
  mostPhotographed: { event: ShowEvent; count: number } | null;
  favoriteVenue: { name: string; avg: number } | null;
  mostVisitedVenue: NamedCount | null;
  favoriteCategory: CategoryStat | null;
  mostActiveCity: NamedCount | null;

  byMonth: MonthStat[];
  mostActiveMonth: MonthStat | null;

  achievements: Achievement[];
}

const heMonth = new Intl.DateTimeFormat("he-IL", { month: "long" });
const MONTH_LABELS = Array.from({ length: 12 }, (_, m) =>
  heMonth.format(new Date(2020, m, 1)),
);

function topNamed(counts: Map<string, number>): NamedCount | null {
  let best: NamedCount | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

export function computeStats(
  events: ShowEvent[],
  subscriptions: Subscription[],
  photoCountByEvent: Record<string, number>,
  totalPhotos: number,
): Stats {
  const today = todayStr();
  const year = today.slice(0, 4);
  const ym = today.slice(0, 7);

  const attended = events.filter((e) => isPast(e.date));
  const rated = events.filter((e) => e.rating);

  const avgRating =
    rated.length > 0
      ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length
      : null;

  // Category breakdown — every category, sorted by frequency.
  const categoryBreakdown: CategoryStat[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    color: c.color,
    count: events.filter((e) => e.category === c.id).length,
  })).sort((a, b) => b.count - a.count);

  const favoriteCategory =
    (categoryBreakdown[0]?.count ?? 0) > 0 ? categoryBreakdown[0] : null;

  // Highest-rated event (newest wins ties).
  const topRated =
    rated
      .slice()
      .sort(
        (a, b) =>
          (b.rating ?? 0) - (a.rating ?? 0) || b.date.localeCompare(a.date),
      )[0] ?? null;

  // Most photographed event.
  let mostPhotographed: { event: ShowEvent; count: number } | null = null;
  for (const e of events) {
    const count = photoCountByEvent[e.id] ?? 0;
    if (count > 0 && (!mostPhotographed || count > mostPhotographed.count)) {
      mostPhotographed = { event: e, count };
    }
  }

  // Venue / city tallies.
  const venueCounts = new Map<string, number>();
  const venueRatingSum = new Map<string, number>();
  const venueRatingN = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  for (const e of events) {
    if (e.venue) {
      venueCounts.set(e.venue, (venueCounts.get(e.venue) ?? 0) + 1);
      if (e.rating) {
        venueRatingSum.set(e.venue, (venueRatingSum.get(e.venue) ?? 0) + e.rating);
        venueRatingN.set(e.venue, (venueRatingN.get(e.venue) ?? 0) + 1);
      }
    }
    if (e.city) cityCounts.set(e.city, (cityCounts.get(e.city) ?? 0) + 1);
  }

  const mostVisitedVenue = topNamed(venueCounts);
  const mostActiveCity = topNamed(cityCounts);

  let favoriteVenue: { name: string; avg: number } | null = null;
  for (const [name, n] of venueRatingN) {
    const avg = (venueRatingSum.get(name) ?? 0) / n;
    if (!favoriteVenue || avg > favoriteVenue.avg) favoriteVenue = { name, avg };
  }

  // Activity by month (current calendar year).
  const byMonth: MonthStat[] = MONTH_LABELS.map((label, month) => ({
    month,
    label,
    count: events.filter(
      (e) => e.date.slice(0, 4) === year && Number(e.date.slice(5, 7)) - 1 === month,
    ).length,
  }));
  const mostActiveMonth = byMonth.reduce<MonthStat | null>(
    (best, m) => (m.count > 0 && (!best || m.count > best.count) ? m : best),
    null,
  );

  const categoriesExperienced = new Set(events.map((e) => category(e.category).id))
    .size;
  const activeSubscriptions = subscriptions.filter(
    (s) => !s.endDate || s.endDate >= today,
  ).length;

  const countOf = (id: string) =>
    events.filter((e) => e.category === id).length;

  const achievements: Achievement[] = [
    achievement("theater", "🎭", "חובב תיאטרון", "5 הצגות ביומן", countOf("play"), 5),
    achievement("concert", "🎤", "אלוף ההופעות", "5 הופעות ביומן", countOf("concert"), 5),
    achievement("cinema", "🎬", "חובב קולנוע", "5 סרטים ביומן", countOf("movie"), 5),
    achievement(
      "starter",
      "🌟",
      "מבקר תרבות מתחיל",
      "האירוע הראשון שלך",
      events.length,
      1,
    ),
    achievement(
      "advanced",
      "🏆",
      "מבקר תרבות מתקדם",
      "20 אירועים ביומן",
      events.length,
      20,
    ),
    achievement(
      "diverse",
      "🎨",
      "איש אשכולות",
      "5 קטגוריות שונות",
      categoriesExperienced,
      5,
    ),
    achievement(
      "photographer",
      "📸",
      "צלם הזיכרונות",
      "10 תמונות שהועלו",
      totalPhotos,
      10,
    ),
    achievement(
      "critic",
      "✍️",
      "מבקר ביקורתי",
      "10 אירועים מדורגים",
      rated.length,
      10,
    ),
  ];

  return {
    totalEvents: events.length,
    totalAttended: attended.length,
    thisYear: events.filter((e) => e.date.slice(0, 4) === year).length,
    thisMonth: events.filter((e) => e.date.slice(0, 7) === ym).length,
    avgRating,
    totalPhotos,
    activeSubscriptions,
    categoriesExperienced,
    categoryBreakdown,
    topRated,
    mostPhotographed,
    favoriteVenue,
    mostVisitedVenue,
    favoriteCategory,
    mostActiveCity,
    byMonth,
    mostActiveMonth,
    achievements,
  };
}

function achievement(
  id: string,
  icon: string,
  title: string,
  description: string,
  current: number,
  target: number,
): Achievement {
  return {
    id,
    icon,
    title,
    description,
    current: Math.min(current, target),
    target,
    unlocked: current >= target,
  };
}
