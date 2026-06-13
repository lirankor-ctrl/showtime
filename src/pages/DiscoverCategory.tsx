import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import UserLinkForm from "../components/UserLinkForm";
import { useToast } from "../components/useToast";
import { fetchLinksByCategory, type ExternalLink } from "../data/links";
import {
  deleteUserLink,
  fetchUserLinksByCategory,
  type UserLink,
} from "../data/userLinks";
import { discoveryCategory } from "../utils/discovery";

// Lists curated external booking sites for one discovery category, together with
// the user's own personal links. All links open in the system browser
// (target="_blank") — no in-app WebView — so the user can return to SHOW TIME
// naturally.
export default function DiscoverCategory() {
  const { category = "" } = useParams();
  const navigate = useNavigate();
  const meta = discoveryCategory(category);
  const { toast, showToast } = useToast();

  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [userLinks, setUserLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserLink | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    // Official links are required; personal links are best-effort so the page
    // keeps working even before the user_external_links table exists (schema
    // not yet re-run).
    Promise.all([
      fetchLinksByCategory(category),
      fetchUserLinksByCategory(category).catch(() => [] as UserLink[]),
    ])
      .then(([official, personal]) => {
        if (!active) return;
        setLinks(official);
        setUserLinks(personal);
      })
      .catch(() => active && setError("שגיאה בטעינת הקישורים. נסו לרענן."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  function onSaved(link: UserLink) {
    setUserLinks((cur) => {
      const without = cur.filter((l) => l.id !== link.id);
      return [...without, link];
    });
    setFormOpen(false);
    setEditing(null);
    showToast(editing ? "הקישור עודכן" : "הקישור נוסף 🎉");
  }

  async function onDelete(link: UserLink) {
    if (!window.confirm(`למחוק את הקישור "${link.title}"?`)) return;
    try {
      await deleteUserLink(link.id);
      setUserLinks((cur) => cur.filter((l) => l.id !== link.id));
      showToast("הקישור נמחק");
    } catch {
      showToast("מחיקת הקישור נכשלה");
    }
  }

  const hasAny = links.length > 0 || userLinks.length > 0;

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate("/discover")}>
        → חזרה לגילוי
      </button>

      <h1 style={{ fontSize: "1.5rem", marginBottom: 4, display: "flex", gap: 10, alignItems: "center" }}>
        <span aria-hidden style={{ fontSize: "1.8rem" }}>{meta?.icon ?? "🌐"}</span>
        {meta?.label ?? "גילוי אירועים"}
      </h1>
      <p className="muted" style={{ margin: "0 2px 16px", fontSize: "0.85rem" }}>
        הקישורים נפתחים בדפדפן החיצוני.
      </p>

      {error && <div className="warn">{error}</div>}

      {loading ? (
        <div className="spinner" aria-label="טוען" />
      ) : (
        <>
          {!hasAny && !error && (
            <EmptyState
              glyph="🌐"
              title="אין עדיין קישורים"
              text="הוסיפו קישור אישי משלכם כדי להתחיל."
            />
          )}

          {links.map((l) => (
            <a
              key={l.id}
              className="link-card fade-in"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="link-body">
                <span className="link-title">{l.title}</span>
                {l.description && <span className="link-desc">{l.description}</span>}
                <span className="link-url" dir="ltr">
                  {l.url.replace(/^https?:\/\//, "")}
                </span>
              </span>
              <span className="link-arrow" aria-hidden>
                ↗
              </span>
            </a>
          ))}

          {userLinks.map((l) => (
            <div key={l.id} className="link-card-wrap fade-in">
              <a
                className="link-card"
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="link-body">
                  <span className="link-title">
                    {l.title}
                    <span className="personal-badge">קישור אישי</span>
                  </span>
                  {l.description && <span className="link-desc">{l.description}</span>}
                  <span className="link-url" dir="ltr">
                    {l.url.replace(/^https?:\/\//, "")}
                  </span>
                </span>
                <span className="link-arrow" aria-hidden>
                  ↗
                </span>
              </a>
              <div className="link-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setEditing(l);
                    setFormOpen(true);
                  }}
                >
                  ✎ עריכה
                </button>
                <button type="button" className="btn danger" onClick={() => onDelete(l)}>
                  🗑 מחיקה
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn gold block"
            style={{ marginTop: 6 }}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            ＋ הוסף קישור
          </button>
        </>
      )}

      {formOpen && (
        <UserLinkForm
          category={category}
          initial={editing ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}

      {toast}
    </div>
  );
}
