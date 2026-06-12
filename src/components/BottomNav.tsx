import { useState } from "react";
import { NavLink } from "react-router-dom";
import BottomSheetMenu from "./BottomSheetMenu";

// Primary navigation: 3 destinations only. Home (unchanged), event discovery
// (globe), and a menu that opens the bottom-sheet with everything else.
export default function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="bottom-nav">
        <NavLink to="/" end aria-label="בית">
          <span className="ico">🎭</span>
        </NavLink>
        <NavLink to="/discover" aria-label="גילוי אירועים">
          <span className="ico">🌐</span>
        </NavLink>
        <button
          type="button"
          className={`nav-menu-btn ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label="תפריט"
        >
          <span className="ico">☰</span>
        </button>
      </nav>
      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
