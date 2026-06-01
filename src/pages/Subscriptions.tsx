import { Link } from "react-router-dom";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EmptyState from "../components/EmptyState";
import { subscriptionWarnings, usedPercent } from "../utils/subscriptions";
import { formatShort } from "../utils/dates";

export default function Subscriptions() {
  const { subscriptions, events } = useApp();

  return (
    <div className="page">
      <AppHeader title="מנויים" subtitle="מנויים ומינויים תרבותיים" />

      {subscriptions.length === 0 ? (
        <EmptyState
          glyph="🎫"
          title="אין מנויים עדיין"
          text="הוסיפו מנוי לתיאטרון, להיכל קונצרטים או כרטיסיית קולנוע — ונעקוב עבורכם אחרי הכרטיסים שנותרו."
          action={
            <Link to="/subscriptions/new" className="btn primary">
              ＋ הוספת מנוי
            </Link>
          }
        />
      ) : (
        subscriptions.map((s) => {
          const warnings = subscriptionWarnings(s);
          const related = events.filter((e) => e.subscriptionId === s.id);
          const pct = usedPercent(s);
          const color = s.color || "var(--gold)";
          return (
            <Link
              key={s.id}
              to={`/subscriptions/${s.id}/edit`}
              className="card fade-in"
              style={{ display: "block", marginBottom: 12, color: "inherit" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.1rem" }}>{s.name}</h2>
                {s.remainingTickets !== undefined && s.totalTickets !== undefined && (
                  <span className="badge" style={{ background: color }}>
                    {s.remainingTickets}/{s.totalTickets}
                  </span>
                )}
              </div>
              {s.venue && <div className="muted" style={{ fontSize: "0.85rem" }}>{s.venue}</div>}

              {s.totalTickets !== undefined && (
                <div className="progress">
                  <i style={{ width: `${pct}%`, background: color }} />
                </div>
              )}

              <div className="meta muted" style={{ display: "flex", gap: 12, marginTop: 10, fontSize: "0.8rem", flexWrap: "wrap" }}>
                {s.endDate && <span>בתוקף עד {formatShort(s.endDate)}</span>}
                <span>{related.length} אירועים מקושרים</span>
              </div>

              {warnings.map((w, i) => (
                <div key={i} className={`warn ${w.level === "info" ? "gold" : ""}`} style={{ marginTop: 8, marginBottom: 0 }}>
                  ⚠️ {w.text}
                </div>
              ))}
            </Link>
          );
        })
      )}

      <Link to="/subscriptions/new" className="fab" aria-label="הוספת מנוי">
        ＋
      </Link>
    </div>
  );
}
