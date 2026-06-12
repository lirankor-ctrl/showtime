import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import { isMemory } from "../utils/eventStatus";

export default function Memories() {
  const { events } = useApp();

  const { past, avg } = useMemo(() => {
    // Most recent first — a scrapbook reads newest-to-oldest.
    const p = events.filter(isMemory).reverse();
    const rated = p.filter((e) => e.rating);
    const a = rated.length
      ? (rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;
    return { past: p, avg: a };
  }, [events]);

  return (
    <div className="page">
      <AppHeader title="זיכרונות" subtitle="ספר החוויות התרבותיות שלי" />

      {past.length === 0 ? (
        <EmptyState
          glyph="📖"
          title="אין עדיין זיכרונות"
          text="אחרי שתשתתפו באירוע, הוא יופיע כאן עם הדירוג, הסקירה והתמונות שלכם."
          action={
            <Link to="/events" className="btn primary">
              לאירועים
            </Link>
          }
        />
      ) : (
        <>
          <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--gold)" }}>{past.length}</div>
              <div className="muted" style={{ fontSize: "0.8rem" }}>אירועים שחוויתי</div>
            </div>
            {avg && (
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--gold)" }}>★ {avg}</div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>דירוג ממוצע</div>
              </div>
            )}
          </div>
          {past.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </>
      )}
    </div>
  );
}
