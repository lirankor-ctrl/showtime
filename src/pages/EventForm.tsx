import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, type NewEventInput } from "../store/AppStore";
import { CATEGORIES } from "../utils/categories";
import { todayStr } from "../utils/dates";
import RatingStars from "../components/RatingStars";
import PhotoGallery from "../components/PhotoGallery";
import PosterField from "../components/PosterField";
import type { CategoryId } from "../types";

// Quarter-hour options (00/15/30/45) covering a full day, offered as quick
// suggestions on the time field. Manual entry of any exact minute still works.
const QUARTER_HOUR_TIMES: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

const empty: NewEventInput = {
  title: "",
  category: "play",
  date: todayStr(),
  time: "",
  venue: "",
  city: "",
  seats: "",
  notes: "",
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, subscriptions, saveEvent } = useApp();
  const editing = Boolean(id);

  const [form, setForm] = useState<NewEventInput>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loadedRef = useRef(false);

  // Load the existing event once it's available — but only once, so unsaved
  // edits aren't wiped when the store reloads (e.g. after a poster change).
  useEffect(() => {
    if (id && !loadedRef.current) {
      const found = events.find((e) => e.id === id);
      if (found) {
        setForm({ ...found });
        loadedRef.current = true;
      }
    }
  }, [id, events]);

  function set<K extends keyof NewEventInput>(key: K, value: NewEventInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isPastEvent = form.date < todayStr();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // guard against double-submit (e.g. Enter + click)
    if (!form.title.trim()) {
      setError("יש להזין שם לאירוע");
      return;
    }
    // Normalize empty numeric/text fields so we don't store empty strings.
    const payload: NewEventInput = {
      ...form,
      title: form.title.trim(),
      time: form.time || undefined,
      ticketsCount: form.ticketsCount || undefined,
      ticketPrice: form.ticketPrice || undefined,
      subscriptionTicketsUsed: form.subscriptionId
        ? form.subscriptionTicketsUsed || 1
        : undefined,
      subscriptionId: form.subscriptionId || undefined,
    };
    setBusy(true);
    setError("");
    try {
      const savedId = await saveEvent(payload);
      navigate(`/events/${savedId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת האירוע נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(-1)}>
        → חזרה
      </button>
      <h1 style={{ marginBottom: 18 }}>{editing ? "עריכת אירוע" : "אירוע חדש"}</h1>

      {error && <div className="warn">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>שם האירוע *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="לדוגמה: אנה קרנינה"
            autoFocus
          />
        </div>

        <div className="field">
          <label>קטגוריה</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as CategoryId)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>תמונת כרזה לאירוע</label>
          {editing ? (
            <PosterField eventId={id!} />
          ) : (
            <p className="muted" style={{ fontSize: "0.82rem", margin: 0 }}>
              ניתן להוסיף כרזה לאחר שמירת האירוע, מתוך עמוד עריכת האירוע.
            </p>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label>תאריך</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="field">
            <label>שעה</label>
            <input
              type="time"
              list="time-options"
              value={form.time ?? ""}
              onChange={(e) => set("time", e.target.value)}
            />
            {/* Quick 15-minute suggestions; any exact time can still be typed
                or chosen from the native picker. */}
            <datalist id="time-options">
              {QUARTER_HOUR_TIMES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>אולם / מקום</label>
            <input
              value={form.venue ?? ""}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="תיאטרון הקאמרי"
            />
          </div>
          <div className="field">
            <label>עיר</label>
            <input
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
              placeholder="תל אביב"
            />
          </div>
        </div>

        <div className="field">
          <label>פרטי מקומות ישיבה</label>
          <input
            value={form.seats ?? ""}
            onChange={(e) => set("seats", e.target.value)}
            placeholder="שורה 7, מקומות 12–13"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>מספר כרטיסים</label>
            <input
              type="number"
              min={0}
              value={form.ticketsCount ?? ""}
              onChange={(e) => set("ticketsCount", Number(e.target.value) || undefined)}
            />
          </div>
          <div className="field">
            <label>מחיר כרטיס (₪)</label>
            <input
              type="number"
              min={0}
              value={form.ticketPrice ?? ""}
              onChange={(e) => set("ticketPrice", Number(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="field">
          <label>קישור לכרטיסים / אתר</label>
          <input
            type="url"
            value={form.ticketUrl ?? ""}
            onChange={(e) => set("ticketUrl", e.target.value)}
            placeholder="https://"
          />
        </div>

        {subscriptions.length > 0 && (
          <div className="field-row">
            <div className="field">
              <label>מנוי בשימוש</label>
              <select
                value={form.subscriptionId ?? ""}
                onChange={(e) => set("subscriptionId", e.target.value || undefined)}
              >
                <option value="">ללא מנוי</option>
                {subscriptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {form.subscriptionId && (
              <div className="field">
                <label>כרטיסים מהמנוי</label>
                <input
                  type="number"
                  min={0}
                  value={form.subscriptionTicketsUsed ?? 1}
                  onChange={(e) =>
                    set("subscriptionTicketsUsed", Number(e.target.value) || 0)
                  }
                />
              </div>
            )}
          </div>
        )}

        <div className="field">
          <label>הערות לפני האירוע</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="חניה, תזכורות, מי מגיע…"
          />
        </div>

        {/* After-the-event memory fields, shown for past dates. */}
        {isPastEvent && (
          <div className="card" style={{ marginBottom: 14 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>
              📖 אחרי האירוע
            </h2>
            <div className="field">
              <label>דירוג</label>
              <RatingStars
                value={form.rating ?? 0}
                onChange={(v) => set("rating", v || undefined)}
                size="1.6rem"
              />
            </div>
            <div className="field">
              <label>סקירה / זיכרונות</label>
              <textarea
                value={form.review ?? ""}
                onChange={(e) => set("review", e.target.value)}
                placeholder="איך היה? מה הרגשתם?"
              />
            </div>
            {editing && (
              <div className="field">
                <label>תמונות</label>
                <PhotoGallery eventId={id!} />
              </div>
            )}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? "שומר…" : editing ? "שמירת שינויים" : "הוספת האירוע"}
          </button>
        </div>
      </form>

      {!editing && (
        <p className="muted center" style={{ marginTop: 12, fontSize: "0.82rem" }}>
          תמונות אפשר להוסיף אחרי שמירת האירוע, מתוך עמוד האירוע.
        </p>
      )}
    </div>
  );
}
