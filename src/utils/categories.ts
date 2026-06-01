import type { CategoryId } from "../types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string; // accent color used across badges, calendar dots, borders
  icon: string; // emoji glyph for quick visual scanning
}

// Ordered list — used for selects, filters and the legend.
export const CATEGORIES: CategoryMeta[] = [
  { id: "play", label: "הצגה", color: "#b3122f", icon: "🎭" },
  { id: "concert", label: "הופעה", color: "#7c5cff", icon: "🎤" },
  { id: "movie", label: "סרט", color: "#e0b54a", icon: "🎬" },
  { id: "classical", label: "קונצרט", color: "#2f9e6f", icon: "🎻" },
  { id: "standup", label: "סטנדאפ", color: "#e8862e", icon: "🎙️" },
  { id: "lecture", label: "הרצאה", color: "#3f9bd6", icon: "📚" },
  { id: "festival", label: "פסטיבל", color: "#d65aa8", icon: "🎪" },
  { id: "other", label: "אחר", color: "#8a8a9a", icon: "✨" },
];

const BY_ID: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export function category(id: CategoryId): CategoryMeta {
  return BY_ID[id] ?? BY_ID.other;
}
