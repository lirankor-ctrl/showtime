import { useEffect, useRef, useState } from "react";
import { useAuth } from "../store/AuthStore";
import {
  deleteEventPhoto,
  listEventPhotos,
  uploadEventPhoto,
  type EventPhoto,
} from "../data/photos";

interface Props {
  eventId: string;
  editable?: boolean;
}

// Event photos backed by the private Supabase Storage bucket `event-photos`.
export default function PhotoGallery({ eventId, editable = true }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setPhotos(await listEventPhotos(eventId));
    } catch {
      setError("שגיאה בטעינת התמונות");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!user || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      for (const f of files) await uploadEventPhoto(user.id, eventId, f);
      await load();
    } catch {
      setError("העלאת התמונה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: EventPhoto) {
    setBusy(true);
    try {
      await deleteEventPhoto(p.id, p.storagePath);
      await load();
    } catch {
      setError("מחיקת התמונה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="warn">{error}</div>}
      {photos.length > 0 && (
        <div className="gallery">
          {photos.map((p) => (
            <div className="ph" key={p.id}>
              <img src={p.url} alt="תמונה מהאירוע" loading="lazy" />
              {editable && (
                <button type="button" aria-label="מחיקת תמונה" onClick={() => remove(p)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={onPick}
          />
          <button
            type="button"
            className="btn block ghost"
            style={{ marginTop: 10 }}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "מעלה…" : "📷 הוספת תמונות"}
          </button>
        </>
      )}
    </div>
  );
}
