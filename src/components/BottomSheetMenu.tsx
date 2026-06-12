import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/AppStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface MenuItem {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

// Modern bottom-sheet menu: the secondary destinations that no longer live in
// the (now 3-item) bottom navigation. Animated, safe-area aware, RTL.
export default function BottomSheetMenu({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { sharedWithMe } = useApp();

  // Close on Escape; lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items: MenuItem[] = [
    { to: "/calendar", icon: "📅", label: "לוח שנה" },
    { to: "/events", icon: "🎟️", label: "אירועים" },
    { to: "/memories", icon: "📖", label: "זיכרונות" },
    { to: "/statistics", icon: "📊", label: "הסטטיסטיקות שלי" },
    { to: "/subscriptions", icon: "🎫", label: "מנויים" },
    { to: "/shared", icon: "📨", label: "אירועים ששותפו איתי", badge: sharedWithMe.length },
    { to: "/settings", icon: "⚙️", label: "הגדרות" },
  ];

  function go(to: string) {
    onClose();
    navigate(to);
  }

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="תפריט"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden />
        <h2 className="sheet-title">תפריט</h2>
        <div className="sheet-list">
          {items.map((it) => (
            <button key={it.to} className="sheet-item" onClick={() => go(it.to)}>
              <span className="sheet-ico" aria-hidden>
                {it.icon}
              </span>
              <span className="sheet-label">{it.label}</span>
              {it.badge ? <span className="sheet-badge">{it.badge}</span> : null}
              <span className="sheet-chevron" aria-hidden>
                ‹
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
