import { useMemo, useState } from "react";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EventCard from "../components/EventCard";
import { CATEGORIES, category } from "../utils/categories";
import {
  HEB_WEEKDAYS,
  formatMonthYear,
  toDateStr,
  todayStr,
} from "../utils/dates";
import type { ShowEvent } from "../types";

export default function CalendarPage() {
  const { events } = useApp();
  const today = todayStr();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(today);

  // Group events by date for quick lookup of dots per cell.
  const byDate = useMemo(() => {
    const map = new Map<string, ShowEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  // 42 cells (6 weeks) starting from the Sunday on/before the 1st.
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const month = cursor.getMonth();
  const selectedEvents = byDate.get(selected) ?? [];

  // Legend shows only the categories the user actually has events in, in the
  // canonical CATEGORIES order. Updates automatically as events change.
  const usedCategories = useMemo(() => {
    const used = new Set(events.map((e) => e.category));
    return CATEGORIES.filter((c) => used.has(c.id));
  }, [events]);

  function move(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  return (
    <div className="page">
      <AppHeader title="לוח שנה" subtitle="אירועים לפי תאריך" />

      <div className="cal-head">
        <button onClick={() => move(-1)} aria-label="חודש קודם">
          ›
        </button>
        <h2 style={{ fontSize: "1.1rem" }}>{formatMonthYear(cursor)}</h2>
        <button onClick={() => move(1)} aria-label="חודש הבא">
          ‹
        </button>
      </div>

      <div className="cal-grid">
        {HEB_WEEKDAYS.map((d) => (
          <div className="dow" key={d}>
            {d}
          </div>
        ))}
        {cells.map((d) => {
          const ds = toDateStr(d);
          const dayEvents = byDate.get(ds) ?? [];
          const classes = [
            "cal-cell",
            d.getMonth() !== month ? "out" : "",
            ds === today ? "today" : "",
            ds === selected ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={ds} className={classes} onClick={() => setSelected(ds)}>
              <span>{d.getDate()}</span>
              {dayEvents.length > 0 && (
                <span className="cal-dots">
                  {dayEvents.slice(0, 3).map((e) => (
                    <i key={e.id} style={{ background: category(e.category).color }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category legend — only the categories actually in use. */}
      {usedCategories.length > 0 && (
        <div className="chip-row" style={{ marginTop: 14, flexWrap: "wrap", overflow: "visible" }}>
          {usedCategories.map((c) => (
            <span key={c.id} className="badge" style={{ background: c.color, opacity: 0.9 }}>
              {c.label}
            </span>
          ))}
        </div>
      )}

      <h2 className="section-title">אירועים ב־{selected.split("-").reverse().join("/")}</h2>
      {selectedEvents.length === 0 ? (
        <p className="muted center" style={{ padding: "10px 0" }}>
          אין אירועים ביום זה.
        </p>
      ) : (
        selectedEvents.map((e) => <EventCard key={e.id} event={e} />)
      )}
    </div>
  );
}
