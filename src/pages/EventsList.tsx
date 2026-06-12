import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppStore";
import { useAuth } from "../store/AuthStore";
import AppHeader from "../components/AppHeader";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import { CATEGORIES } from "../utils/categories";
import { isMemory } from "../utils/eventStatus";
import type { CategoryId, ShowEvent } from "../types";

type When = "all" | "upcoming" | "past";
type Sort = "soon" | "recent" | "rating";

interface StoredFilters {
  query?: string;
  cat?: CategoryId | "all";
  when?: When;
  minRating?: number;
  subId?: string;
  sort?: Sort;
}

export default function EventsList() {
  const { events, subscriptions } = useApp();
  const { user } = useAuth();

  // Filters are remembered locally, per authenticated user.
  const storageKey = `show-time:events-filters:${user?.id ?? "anon"}`;
  const stored = useMemo<StoredFilters>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }, [storageKey]);

  const [query, setQuery] = useState(stored.query ?? "");
  const [cat, setCat] = useState<CategoryId | "all">(stored.cat ?? "all");
  const [when, setWhen] = useState<When>(stored.when ?? "all");
  const [minRating, setMinRating] = useState(stored.minRating ?? 0);
  const [subId, setSubId] = useState(stored.subId ?? "all");
  const [sort, setSort] = useState<Sort>(stored.sort ?? "soon");

  // Persist whenever any filter changes (explicit user actions only).
  useEffect(() => {
    const data: StoredFilters = { query, cat, when, minRating, subId, sort };
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  }, [storageKey, query, cat, when, minRating, subId, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = events.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (when === "upcoming" && isMemory(e)) return false;
      if (when === "past" && !isMemory(e)) return false;
      if (minRating > 0 && (e.rating ?? 0) < minRating) return false;
      if (subId !== "all" && e.subscriptionId !== subId) return false;
      if (q) {
        const hay = [e.title, e.venue, e.city, e.notes, e.review]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const byDate = (a: ShowEvent, b: ShowEvent) =>
      a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");

    return [...list].sort((a, b) => {
      if (sort === "recent") return -byDate(a, b);
      if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0) || byDate(a, b);
      return byDate(a, b); // "soon"
    });
  }, [events, query, cat, when, minRating, subId, sort]);

  return (
    <div className="page">
      <AppHeader title="אירועים" subtitle={`${events.length} אירועים ביומן`} />

      <div className="field" style={{ marginBottom: 10 }}>
        <input
          type="search"
          placeholder="🔍 חיפוש לפי שם, מקום או הערה…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chip-row">
        {(["all", "upcoming", "past"] as When[]).map((w) => (
          <button
            key={w}
            className={`chip ${when === w ? "active" : ""}`}
            onClick={() => setWhen(w)}
          >
            {w === "all" ? "הכל" : w === "upcoming" ? "קרובים" : "עברו"}
          </button>
        ))}
      </div>

      <div className="chip-row">
        <button className={`chip ${cat === "all" ? "active" : ""}`} onClick={() => setCat("all")}>
          כל הקטגוריות
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? "active" : ""}`}
            onClick={() => setCat(c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="field-row" style={{ marginTop: 6 }}>
        <div className="field">
          <label>דירוג מינימלי</label>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>הכל</option>
            <option value={3}>★ 3 ומעלה</option>
            <option value={4}>★ 4 ומעלה</option>
            <option value={5}>★ 5 בלבד</option>
          </select>
        </div>
        <div className="field">
          <label>מנוי</label>
          <select value={subId} onChange={(e) => setSubId(e.target.value)}>
            <option value="all">הכל</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>מיון</label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="soon">לפי תאריך (קרוב → רחוק)</option>
          <option value="recent">לפי תאריך (חדש → ישן)</option>
          <option value="rating">לפי דירוג (גבוה → נמוך)</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          glyph="🔎"
          title="לא נמצאו אירועים"
          text="נסו לשנות את החיפוש או הסינון, או הוסיפו אירוע חדש."
          action={
            <Link to="/events/new" className="btn primary">
              ＋ הוספת אירוע
            </Link>
          }
        />
      ) : (
        <div style={{ marginTop: 8 }}>
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      <Link to="/events/new" className="fab" aria-label="הוספת אירוע">
        +
      </Link>
    </div>
  );
}
