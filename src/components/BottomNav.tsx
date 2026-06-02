import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", icon: "🎭", label: "בית", end: true },
  { to: "/calendar", icon: "📅", label: "לוח שנה" },
  { to: "/events", icon: "🎟️", label: "אירועים" },
  { to: "/subscriptions", icon: "🎫", label: "מנויים" },
  { to: "/memories", icon: "📖", label: "זיכרונות" },
  { to: "/statistics", icon: "📊", label: "סטטיסטיקה" },
  { to: "/settings", icon: "⚙️", label: "הגדרות" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end}>
          <span className="ico">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
