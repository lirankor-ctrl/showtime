import { useEffect, useRef, useState } from "react";

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

// Poster picker for a not-yet-saved event: keeps the File locally (no upload)
// and previews it via an object URL. The form uploads it after the event is
// created, through the store's setEventPoster.
export default function PosterDraftField({ file, onChange, disabled }: Props) {
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (picked) onChange(picked);
  }

  return (
    <div>
      {previewUrl ? (
        <div className="poster-preview">
          <img src={previewUrl} alt="תצוגה מקדימה של הכרזה" />
        </div>
      ) : (
        <div className="poster-empty">לא נבחרה כרזה (אופציונלי)</div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn ghost"
          style={{ flex: 1 }}
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          {file ? "🖼️ החלפת כרזה" : "🖼️ הוסף כרזה"}
        </button>
        {file && (
          <button
            type="button"
            className="btn danger"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            הסרה
          </button>
        )}
      </div>
    </div>
  );
}
