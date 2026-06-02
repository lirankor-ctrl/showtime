import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../store/AppStore";
import CategoryBadge from "../components/CategoryBadge";
import RatingStars from "../components/RatingStars";
import PhotoGallery from "../components/PhotoGallery";
import { useToast } from "../components/useToast";
import { formatDateTime, isPast, countdownLabel } from "../utils/dates";
import { shareEvent } from "../utils/share";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    events,
    subscriptions,
    posterUrls,
    saveEvent,
    removeEvent,
    shareEvent: shareWithUser,
  } = useApp();
  const { toast, showToast } = useToast();

  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState("");

  // In-app share-with-user state.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function doShareWithUser() {
    if (shareBusy) return;
    const email = shareEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setShareMsg({ text: "יש להזין כתובת אימייל תקינה", ok: false });
      return;
    }
    setShareBusy(true);
    setShareMsg(null);
    try {
      const res = await shareWithUser(email, event!);
      if (res === "ok") {
        setShareMsg({ text: "האירוע שותף בהצלחה", ok: true });
        setShareEmail("");
      } else if (res === "self") {
        setShareMsg({ text: "אי אפשר לשתף אירוע עם עצמך", ok: false });
      } else {
        setShareMsg({ text: "לא נמצא משתמש עם האימייל הזה", ok: false });
      }
    } catch (err) {
      setShareMsg({
        text: err instanceof Error ? err.message : "שיתוף האירוע נכשל",
        ok: false,
      });
    } finally {
      setShareBusy(false);
    }
  }

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
        <button className="back-link" onClick={() => navigate("/events")}>
          → חזרה
        </button>
        <p className="muted center">האירוע לא נמצא.</p>
      </div>
    );
  }

  const past = isPast(event.date);
  const sub = subscriptions.find((s) => s.id === event.subscriptionId);

  async function onShare() {
    const res = await shareEvent(event!);
    if (res === "copied") showToast("הפרטים הועתקו ללוח 📋");
    else if (res === "shared") showToast("שותף בהצלחה 🎉");
  }

  async function onDelete() {
    if (confirm(`למחוק את "${event!.title}"? פעולה זו אינה הפיכה.`)) {
      try {
        await removeEvent(event!.id);
        navigate("/events");
      } catch {
        showToast("מחיקת האירוע נכשלה");
      }
    }
  }

  function addHighlight() {
    const v = highlightInput.trim();
    if (v && !highlights.includes(v)) setHighlights([...highlights, v]);
    setHighlightInput("");
  }

  async function saveMemory() {
    try {
      await saveEvent({
        ...event!,
        rating: rating || undefined,
        review: review || undefined,
        highlights: highlights.length ? highlights : undefined,
      });
      showToast("הזיכרון נשמר 💛");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "שמירת הזיכרון נכשלה");
    }
  }

  const details: Array<[string, string | undefined]> = [
    ["תאריך ושעה", formatDateTime(event.date, event.time)],
    ["מקום", [event.venue, event.city].filter(Boolean).join(", ") || undefined],
    ["מקומות", event.seats],
    ["כרטיסים", event.ticketsCount ? String(event.ticketsCount) : undefined],
    ["מחיר", event.ticketPrice ? `${event.ticketPrice} ₪` : undefined],
    ["מנוי", sub ? `${sub.name}${event.subscriptionTicketsUsed ? ` · ${event.subscriptionTicketsUsed} כרטיסים` : ""}` : undefined],
  ];

  return (
    <div className="page fade-in">
      <button className="back-link" onClick={() => navigate(-1)}>
        → חזרה
      </button>

      <div style={{ marginBottom: 8 }}>
        <CategoryBadge id={event.category} />
        <span className="badge" style={{ background: "transparent", color: "var(--gold)" }}>
          {countdownLabel(event.date)}
        </span>
      </div>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 14 }}>{event.title}</h1>

      {event.posterImagePath && posterUrls[event.id] && (
        <div className="detail-poster">
          <img src={posterUrls[event.id]} alt={`כרזה — ${event.title}`} />
        </div>
      )}

      <div className="card">
        {details.map(([label, value]) =>
          value ? (
            <div key={label} className="detail" style={{ marginBottom: 10 }}>
              <span className="label">{label}</span>
              <span className="value">{value}</span>
            </div>
          ) : null,
        )}
        {event.ticketUrl && (
          <a className="btn ghost block" href={event.ticketUrl} target="_blank" rel="noreferrer">
            🎟️ קישור לכרטיסים
          </a>
        )}
      </div>

      {event.notes && (
        <>
          <h2 className="section-title">📝 הערות</h2>
          <div className="card">{event.notes}</div>
        </>
      )}

      <div className="btn-row" style={{ marginTop: 16 }}>
        <Link to={`/events/${event.id}/edit`} className="btn block primary">
          ✏️ עריכה
        </Link>
        <button className="btn" onClick={onShare}>
          🔗 שיתוף
        </button>
      </div>

      {/* Share with another registered SHOW TIME user (in addition to the
          native text share above). */}
      <button
        className="btn gold block"
        style={{ marginTop: 10 }}
        onClick={() => {
          setShareOpen((v) => !v);
          setShareMsg(null);
        }}
        aria-expanded={shareOpen}
      >
        👥 שיתוף עם משתמש SHOW TIME
      </button>

      {shareOpen && (
        <div className="card fade-in" style={{ marginTop: 10 }}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>אימייל הנמען</label>
            <input
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), doShareWithUser())}
            />
          </div>
          {shareMsg && (
            <div className={`warn ${shareMsg.ok ? "gold" : ""}`} style={{ marginBottom: 10 }}>
              {shareMsg.ok ? "✅ " : "⚠️ "}
              {shareMsg.text}
            </div>
          )}
          <button
            className="btn primary block"
            onClick={doShareWithUser}
            disabled={shareBusy}
          >
            {shareBusy ? "משתף…" : "שיתוף האירוע"}
          </button>
          <p className="muted" style={{ fontSize: "0.78rem", margin: "10px 0 0" }}>
            האירוע (כולל הכרזה) יישלח למשתמש הרשום. הוא יחליט אם לשמור אותו לאירועים שלו.
          </p>
        </div>
      )}

      {/* Memory archive — available once the event has passed. */}
      {past && (
        <>
          <h2 className="section-title">📖 הזיכרון שלי מהאירוע</h2>
          <div className="card">
            <div className="field">
              <label>דירוג</label>
              <RatingStars value={rating} onChange={setRating} size="1.8rem" />
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

            <div className="field">
              <label>תמונות מהאירוע</label>
              <PhotoGallery eventId={event.id} />
            </div>

            <button className="btn gold block" onClick={saveMemory}>
              💾 שמירת הזיכרון
            </button>
          </div>
        </>
      )}

      <button className="btn danger block" style={{ marginTop: 18 }} onClick={onDelete}>
        🗑️ מחיקת האירוע
      </button>

      {toast}
    </div>
  );
}
