import { useState } from "react";
import { useAuth } from "../store/AuthStore";
import { normalizeUrl } from "../utils/url";
import {
  insertUserLink,
  updateUserLink,
  type UserLink,
} from "../data/userLinks";

interface Props {
  category: string;
  /** When set, the form edits this existing personal link. */
  initial?: UserLink;
  onClose: () => void;
  onSaved: (link: UserLink) => void;
}

// Modal form for creating / editing a personal discovery link. URLs are
// validated and normalized (https:// is added when missing) before saving.
export default function UserLinkForm({ category, initial, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("יש להזין שם לאתר.");
      return;
    }
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("הכתובת אינה תקינה. הזינו כתובת אתר מלאה, למשל https://www.example.co.il");
      return;
    }

    setBusy(true);
    try {
      const draft = {
        title: trimmedTitle,
        url: normalized,
        description: description.trim() || undefined,
      };
      const saved = initial
        ? await updateUserLink(initial.id, draft)
        : await insertUserLink(user!.id, { ...draft, category });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירת הקישור נכשלה");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form className="card fade-in" onSubmit={onSubmit}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>
            {initial ? "עריכת קישור אישי" : "הוספת קישור אישי"}
          </h2>

          {error && <div className="warn">{error}</div>}

          <div className="field">
            <label htmlFor="link-title">שם האתר</label>
            <input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: התיאטרון העירוני"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="link-url">כתובת (URL)</label>
            <input
              id="link-url"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.example.co.il"
              inputMode="url"
            />
          </div>

          <div className="field">
            <label htmlFor="link-desc">תיאור (אופציונלי)</label>
            <input
              id="link-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר"
            />
          </div>

          <div className="btn-row" style={{ marginTop: 4 }}>
            <button type="submit" className="btn primary block" disabled={busy}>
              {busy ? "שומר…" : "שמירה"}
            </button>
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
