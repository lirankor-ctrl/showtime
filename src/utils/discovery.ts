// Event-discovery categories. These are the booking/discovery groupings (a
// superset of the event CATEGORIES used elsewhere) and their `key` matches the
// `category` column of the external_links table.
export interface DiscoveryCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  { key: "theater", label: "הצגות", icon: "🎭", color: "#b3122f" },
  { key: "shows", label: "הופעות", icon: "🎤", color: "#7c5cff" },
  { key: "concerts", label: "קונצרטים", icon: "🎼", color: "#2f9e6f" },
  { key: "movies", label: "סרטים", icon: "🎬", color: "#e0b54a" },
  { key: "standup", label: "סטנדאפ", icon: "😂", color: "#e8862e" },
  { key: "festivals", label: "פסטיבלים", icon: "🎪", color: "#d65aa8" },
  { key: "lectures", label: "הרצאות", icon: "🎓", color: "#3f9bd6" },
  { key: "family", label: "לכל המשפחה", icon: "👨‍👩‍👧‍👦", color: "#d6a93f" },
  { key: "sports", label: "ספורט", icon: "🏟️", color: "#4a9d8e" },
];

export function discoveryCategory(key: string): DiscoveryCategory | undefined {
  return DISCOVERY_CATEGORIES.find((c) => c.key === key);
}
