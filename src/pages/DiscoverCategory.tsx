import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import { fetchLinksByCategory, type ExternalLink } from "../data/links";
import { discoveryCategory } from "../utils/discovery";

// Lists curated external booking sites for one discovery category. Links open
// in the system browser (target="_blank") — no in-app WebView — so the user can
// return to SHOW TIME naturally.
export default function DiscoverCategory() {
  const { category = "" } = useParams();
  const navigate = useNavigate();
  const meta = discoveryCategory(category);

  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchLinksByCategory(category)
      .then((rows) => active && setLinks(rows))
      .catch(() => active && setError("שגיאה בטעינת הקישורים. נסו לרענן."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

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
      ) : links.length === 0 && !error ? (
        <EmptyState
          glyph="🌐"
          title="אין עדיין קישורים"
          text="הקישורים בתחום הזה יתווספו בקרוב."
        />
      ) : (
        links.map((l) => (
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
        ))
      )}
    </div>
  );
}
