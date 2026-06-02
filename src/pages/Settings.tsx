import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { useApp } from "../store/AppStore";
import { useAuth } from "../store/AuthStore";
import { useToast } from "../components/useToast";
import { downloadBackup, restoreBackup } from "../utils/backup";
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  sendTestNotification,
} from "../utils/notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Settings() {
  const { events, subscriptions, sharedWithMe, reload } = useApp();
  const { user, displayName, signOut } = useAuth();
  const { toast, showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [perm, setPerm] = useState<NotificationPermission>(notificationPermission());
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function enableNotifications() {
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      await sendTestNotification();
      showToast("התראות הופעלו 🔔");
    } else {
      showToast("ההרשאה לא ניתנה");
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!confirm("ייבוא גיבוי יוסיף את האירועים והמנויים מהקובץ לחשבונך. להמשיך?")) return;
    try {
      const data = JSON.parse(await file.text());
      await restoreBackup(user.id, data);
      await reload();
      showToast("הגיבוי יובא בהצלחה ✅");
    } catch {
      showToast("שגיאה בייבוא הקובץ");
    }
  }

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
  }

  return (
    <div className="page">
      <AppHeader title="הגדרות" subtitle="חשבון, התראות וגיבוי" />

      <h2 className="section-title">👤 החשבון שלי</h2>
      <div className="card">
        <div className="detail" style={{ marginBottom: 10 }}>
          <span className="label">מחובר כ-</span>
          <span className="value">{displayName}</span>
        </div>
        {user?.email && displayName !== user.email && (
          <div className="detail" style={{ marginBottom: 10 }}>
            <span className="label">אימייל</span>
            <span className="value" dir="ltr">{user.email}</span>
          </div>
        )}
        <button className="btn danger block" onClick={() => signOut()}>
          🚪 התנתקות
        </button>
      </div>

      <h2 className="section-title">📨 שיתופים</h2>
      <div className="card">
        <p style={{ marginTop: 0 }} className="muted">
          אירועים שמשתמשי SHOW TIME אחרים שיתפו איתך.
        </p>
        <Link to="/shared" className="btn ghost block">
          אירועים ששותפו איתי{sharedWithMe.length > 0 ? ` (${sharedWithMe.length})` : ""}
        </Link>
      </div>

      <h2 className="section-title">🔔 התראות</h2>
      <div className="card">
        {!notificationsSupported() ? (
          <p className="muted" style={{ margin: 0 }}>הדפדפן אינו תומך בהתראות.</p>
        ) : perm === "granted" ? (
          <>
            <p style={{ marginTop: 0 }}>ההתראות פעילות. בבוקר יום האירוע תקבלו תזכורת בעת פתיחת האפליקציה.</p>
            <button className="btn ghost block" onClick={() => sendTestNotification()}>
              שליחת התראת בדיקה
            </button>
          </>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>הפעילו התראות כדי לקבל תזכורת בבוקר של כל אירוע.</p>
            <button className="btn primary block" onClick={enableNotifications}>
              הפעלת התראות
            </button>
          </>
        )}
        <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 0 }}>
          הערה: תזכורות מקומיות פועלות כשהאפליקציה פתוחה. התראה מתוזמנת כשהאפליקציה סגורה לחלוטין דורשת שרת — לא נכלל בשלב זה.
        </p>
      </div>

      <h2 className="section-title">💾 גיבוי (אופציונלי)</h2>
      <div className="card">
        <p style={{ marginTop: 0 }} className="muted">
          {events.length} אירועים · {subscriptions.length} מנויים בחשבונך. הנתונים שמורים בענן (Supabase); זהו גיבוי מקומי נוסף לקובץ.
        </p>
        <button
          className="btn gold block"
          style={{ marginBottom: 10 }}
          onClick={() => downloadBackup(events, subscriptions)}
        >
          ⬇️ ייצוא גיבוי (JSON)
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        <button className="btn ghost block" onClick={() => fileRef.current?.click()}>
          ⬆️ ייבוא גיבוי
        </button>
        <p className="muted" style={{ fontSize: "0.78rem", marginBottom: 0 }}>
          תמונות נשמרות ב-Supabase Storage ואינן נכללות בקובץ הגיבוי.
        </p>
      </div>

      {installEvt && (
        <>
          <h2 className="section-title">📲 התקנה</h2>
          <div className="card">
            <p style={{ marginTop: 0 }}>התקינו את SHOW TIME כאפליקציה במסך הבית.</p>
            <button className="btn primary block" onClick={install}>
              התקנת האפליקציה
            </button>
          </div>
        </>
      )}

      <h2 className="section-title">ℹ️ אודות</h2>
      <div className="card">
        <p style={{ marginTop: 0 }} className="muted">
          SHOW TIME — יומן התרבות האישי שלך. הנתונים מאוחסנים באופן מאובטח בחשבונך ב-Supabase, וכל משתמש רואה רק את הנתונים שלו.
        </p>
      </div>

      {toast}
    </div>
  );
}
