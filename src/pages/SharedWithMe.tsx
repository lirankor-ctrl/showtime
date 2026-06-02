import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EmptyState from "../components/EmptyState";
import CategoryBadge from "../components/CategoryBadge";
import RatingStars from "../components/RatingStars";
import { useToast } from "../components/useToast";
import { getSignedImageUrl } from "../lib/images";
import { formatDateTime } from "../utils/dates";
import type { SharedEvent } from "../types";

export default function SharedWithMe() {
  const { sharedWithMe } = useApp();
  const { toast, showToast } = useToast();

  return (
    <div className="page">
      <AppHeader title="אירועים ששותפו איתי" subtitle="אירועים שמשתמשים אחרים שלחו לך" />

      {sharedWithMe.length === 0 ? (
        <EmptyState
          glyph="📨"
          title="אין שיתופים חדשים"
          text="כאן יופיעו אירועים שמשתמשי SHOW TIME אחרים ישתפו איתך."
          action={
            <Link to="/" className="btn primary">
              לדף הבית
            </Link>
          }
        />
      ) : (
        sharedWithMe.map((share) => (
          <SharedCard key={share.id} share={share} onToast={showToast} />
        ))
      )}

      {toast}
    </div>
  );
}

function SharedCard({
  share,
  onToast,
}: {
  share: SharedEvent;
  onToast: (msg: string) => void;
}) {
  const { acceptShare, dismissShare } = useApp();
  const [poster, setPoster] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "dismiss">("");
  const d = share.data;

  useEffect(() => {
    let active = true;
    if (share.posterImagePath) {
      getSignedImageUrl(share.posterImagePath)
        .then((url) => {
          if (active) setPoster(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [share.posterImagePath]);

  async function onSave() {
    if (busy) return;
    setBusy("save");
    try {
      await acceptShare(share);
      onToast("האירוע נשמר לאירועים שלך 🎉");
    } catch {
      onToast("שמירת האירוע נכשלה");
      setBusy("");
    }
  }

  async function onDismiss() {
    if (busy) return;
    setBusy("dismiss");
    try {
      await dismissShare(share.id);
    } catch {
      onToast("הסרת השיתוף נכשלה");
      setBusy("");
    }
  }

  return (
    <div className="card fade-in" style={{ marginBottom: 12 }}>
      <div className="shared-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <CategoryBadge id={d.category} />
          </div>
          <h2 style={{ fontSize: "1.2rem" }}>{d.title}</h2>
          <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
            שותף על ידי {d.senderName || "משתמש"}
          </div>
        </div>
        {poster && (
          <div className="shared-poster" aria-hidden>
            <img src={poster} alt="" />
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="detail" style={{ marginBottom: 8 }}>
          <span className="label">תאריך ושעה</span>
          <span className="value">{formatDateTime(d.date, d.time)}</span>
        </div>
        {(d.venue || d.city) && (
          <div className="detail" style={{ marginBottom: 8 }}>
            <span className="label">מקום</span>
            <span className="value">{[d.venue, d.city].filter(Boolean).join(", ")}</span>
          </div>
        )}
        {d.seats && (
          <div className="detail" style={{ marginBottom: 8 }}>
            <span className="label">מקומות</span>
            <span className="value">{d.seats}</span>
          </div>
        )}
        {d.rating ? (
          <div className="detail" style={{ marginBottom: 8 }}>
            <span className="label">דירוג</span>
            <span className="value">
              <RatingStars value={d.rating} size="1rem" />
            </span>
          </div>
        ) : null}
        {d.notes && (
          <div className="detail" style={{ marginBottom: 8 }}>
            <span className="label">הערות</span>
            <span className="value">{d.notes}</span>
          </div>
        )}
        {d.review && (
          <div className="detail" style={{ marginBottom: 8 }}>
            <span className="label">סקירה</span>
            <span className="value">{d.review}</span>
          </div>
        )}
      </div>

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn primary block" onClick={onSave} disabled={busy !== ""}>
          {busy === "save" ? "שומר…" : "שמור לאירועים שלי"}
        </button>
        <button className="btn danger" onClick={onDismiss} disabled={busy !== ""}>
          {busy === "dismiss" ? "מסיר…" : "התעלם"}
        </button>
      </div>
    </div>
  );
}
