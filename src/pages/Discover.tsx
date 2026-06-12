import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { DISCOVERY_CATEGORIES } from "../utils/discovery";

// Event-discovery homepage: a beautiful grid of category cards. Each opens a
// page listing curated external booking sites (which launch the real browser).
export default function Discover() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <AppHeader title="גילוי אירועים" subtitle="איפה להזמין את החוויה הבאה" />

      <p className="muted" style={{ margin: "0 2px 14px", fontSize: "0.9rem" }}>
        בחרו תחום כדי לגלות אתרים להזמנת כרטיסים. הקישורים נפתחים בדפדפן —
        SHOW TIME יישאר פתוח ברקע.
      </p>

      <div className="discover-grid">
        {DISCOVERY_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className="discover-card fade-in"
            style={{ ["--cat" as string]: c.color }}
            onClick={() => navigate(`/discover/${c.key}`)}
          >
            <span className="discover-icon" aria-hidden>
              {c.icon}
            </span>
            <span className="discover-label">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
