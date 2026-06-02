import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/AppStore";

interface Props {
  eventId: string;
}

// Manage an event's poster/cover image. Persists immediately through the store
// (storage + events.poster_image_path), mirroring PhotoGallery's behaviour.
export default function PosterField({ eventId }: Props) {
  const { events, posterUrls, setEventPoster } = useApp();
  const event = events.find((e) => e.id === eventId);
  const hasPoster = Boolean(event?.posterImagePath);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke any object URL we created when it changes / unmounts.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const shownUrl = localPreview || posterUrls[eventId] || "";

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await setEventPoster(eventId, file);
      setLocalPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "העלאת הכרזה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!confirm("למחוק את תמונת הכרזה?")) return;
    setBusy(true);
    setError("");
    try {
      await setEventPoster(eventId, null);
      setLocalPreview("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "מחיקת הכרזה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="warn">{error}</div>}

      {shownUrl ? (
        <div className="poster-preview">
          <img src={shownUrl} alt="כרזת האירוע" />
        </div>
      ) : (
        <div className="poster-empty">אין כרזה לאירוע זה</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "מעלה…" : hasPoster ? "🖼️ החלפת כרזה" : "🖼️ הוספת כרזה"}
        </button>
        {hasPoster && (
          <button type="button" className="btn danger" disabled={busy} onClick={onRemove}>
            מחיקה
          </button>
        )}
      </div>
    </div>
  );
}
