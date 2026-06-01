import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, type NewSubscriptionInput } from "../store/AppStore";

const COLORS = ["#b3122f", "#7c5cff", "#e0b54a", "#2f9e6f", "#e8862e", "#3f9bd6", "#d65aa8", "#8a8a9a"];

const empty: NewSubscriptionInput = {
  name: "",
  venue: "",
  startDate: "",
  endDate: "",
  notes: "",
  color: COLORS[0],
};

export default function SubscriptionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscriptions, saveSubscription, removeSubscription } = useApp();
  const editing = Boolean(id);

  const [form, setForm] = useState<NewSubscriptionInput>(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      const found = subscriptions.find((s) => s.id === id);
      if (found) setForm({ ...found });
    }
  }, [id, subscriptions]);

  function set<K extends keyof NewSubscriptionInput>(key: K, value: NewSubscriptionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("יש להזין שם למנוי");
      return;
    }
    try {
      await saveSubscription({
        ...form,
        name: form.name.trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        totalTickets: form.totalTickets || undefined,
      });
      navigate("/subscriptions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת המנוי נכשלה");
    }
  }

  async function onDelete() {
    if (id && confirm("למחוק את המנוי? האירועים המקושרים יישארו ללא מנוי.")) {
      try {
        await removeSubscription(id);
        navigate("/subscriptions");
      } catch {
        setError("מחיקת המנוי נכשלה");
      }
    }
  }

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate(-1)}>
        → חזרה
      </button>
      <h1 style={{ marginBottom: 18 }}>{editing ? "עריכת מנוי" : "מנוי חדש"}</h1>

      {error && <div className="warn">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>שם המנוי *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="מנוי הקאמרי 2026"
            autoFocus
          />
        </div>

        <div className="field">
          <label>אולם / ארגון</label>
          <input
            value={form.venue ?? ""}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="תיאטרון הקאמרי, תל אביב"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>תאריך התחלה</label>
            <input
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div className="field">
            <label>תאריך סיום</label>
            <input
              type="date"
              value={form.endDate ?? ""}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>סך הכל כרטיסים</label>
            <input
              type="number"
              min={0}
              value={form.totalTickets ?? ""}
              onChange={(e) => set("totalTickets", Number(e.target.value) || undefined)}
            />
          </div>
          <div className="field">
            <label>כרטיסים שנותרו</label>
            <input
              type="number"
              min={0}
              value={form.remainingTickets ?? ""}
              onChange={(e) => set("remainingTickets", Number(e.target.value) || undefined)}
              placeholder="אוטומטי"
            />
          </div>
        </div>

        <div className="field">
          <label>צבע</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                aria-label={`צבע ${c}`}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: c,
                  border: form.color === c ? "3px solid #fff" : "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>הערות</label>
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <button type="submit" className="btn primary block">
          {editing ? "שמירת שינויים" : "הוספת המנוי"}
        </button>
      </form>

      {editing && (
        <button className="btn danger block" style={{ marginTop: 14 }} onClick={onDelete}>
          🗑️ מחיקת המנוי
        </button>
      )}
    </div>
  );
}
