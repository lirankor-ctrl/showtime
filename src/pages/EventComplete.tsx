import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store/AppStore";
import CategoryBadge from "../components/CategoryBadge";
import RatingStars from "../components/RatingStars";
import PhotoGallery from "../components/PhotoGallery";
import { useToast } from "../components/useToast";
import { formatDateTime } from "../utils/dates";

// Dedicated, rewarding post-event flow: rate, review, add highlights & photos
// (all optional), then move the event to the archive (Memories).
export default function EventComplete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, saveEvent } = useApp();
  const { toast, showToast } = useToast();

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (event) {
      setRating(event.rating ?? 0);
      setReview(event.review ?? "");
      setHighlights(event.highlights ?? []);
    }
  }, [event]);

  if (!event) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => navigate("/")}>
          → חזרה
        </button>
        <p className="muted center">האירוע לא נמצא.</p>
      </div>
    );
  }

  function addHighlight() {
    const v = highlightInput.trim();
    if (v && !highlights.includes(v)) setHighlights([...highlights, v]);
    setHighlightInput("");
  }

  async function archive() {
    if (busy) return;
    setBusy(true);
    try {
      await saveEvent({
        ...event!,
        rating: rating || undefined,
        review: review || undefined,
        highlights: highlights.length ? highlights : undefined,
        archived: true,
      });
      showToast("האירוע נשמר בזיכרונות 💛");
      // Let the success toast register, then return home.
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "שמירת האירוע נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="page fade-in">
      <button className="back-link" onClick={() => navigate(-1)}>
        → חזרה
      </button>

      <div className="complete-hero">
        <div className="complete-glyph" aria-hidden>
          🎬
        </div>
        <div className="eyebrow">האירוע הסתיים</div>
        <h1 style={{ fontSize: "1.5rem", margin: "4px 0 8px" }}>{event.title}</h1>
        <div style={{ marginBottom: 6 }}>
          <CategoryBadge id={event.category} />
        </div>
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          {formatDateTime(event.date, event.time)}
        </p>
      </div>

      <p className="muted center" style={{ margin: "14px 2px 6px", fontSize: "0.88rem" }}>
        איך היה? אפשר למלא הכול, חלק — או פשוט להעביר לארכיון. כל השדות אופציונליים.
      </p>

      <div className="card">
        <div className="field">
          <label>דירוג</label>
          <RatingStars value={rating} onChange={setRating} size="2rem" />
        </div>

        <div className="field">
          <label>סקירה אישית</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="מה אהבתם? מה זכור לכם?"
          />
        </div>

        <div className="field">
          <label>רגעים שאהבתי</label>
          <div className="chip-row" style={{ flexWrap: "wrap", overflow: "visible" }}>
            {highlights.map((h) => (
              <button
                key={h}
                className="chip active"
                onClick={() => setHighlights(highlights.filter((x) => x !== h))}
              >
                {h} ✕
              </button>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <input
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
              placeholder="הוספת רגע (למשל: הסולו בכינור)"
              style={{ flex: 1 }}
            />
            <button type="button" className="btn" onClick={addHighlight}>
              ＋
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>תמונות מהאירוע</label>
          <PhotoGallery eventId={event.id} />
        </div>
      </div>

      <button
        className="btn gold block"
        style={{ marginTop: 18 }}
        onClick={archive}
        disabled={busy}
      >
        {busy ? "שומר…" : "📥 העבר לארכיון"}
      </button>
      <p className="muted center" style={{ fontSize: "0.78rem", marginTop: 10 }}>
        האירוע יעבור לזיכרונות וייעלם מהאירועים הקרובים.
      </p>

      {toast}
    </div>
  );
}
