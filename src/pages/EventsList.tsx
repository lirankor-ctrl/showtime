import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import { CATEGORIES } from "../utils/categories";
import { isPast } from "../utils/dates";
import type { CategoryId } from "../types";

type When = "all" | "upcoming" | "past";

export default function EventsList() {
  const { events, subscriptions } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const [when, setWhen] = useState<When>("all");
  const [minRating, setMinRating] = useState(0);
  const [subId, setSubId] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (when === "upcoming" && isPast(e.date)) return false;
      if (when === "past" && !isPast(e.date)) return false;
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
  }, [events, query, cat, when, minRating, subId]);

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
