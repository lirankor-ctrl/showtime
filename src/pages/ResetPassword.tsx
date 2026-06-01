import { useState } from "react";
import { useAuth } from "../store/AuthStore";

// Shown after the user opens a password-recovery link (PASSWORD_RECOVERY).
export default function ResetPassword() {
  const { updatePassword, clearRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-in">
        <img className="auth-logo" src="/LOGO.jpg" alt="SHOW TIME" />
        <h2 className="center" style={{ fontSize: "1.2rem", marginBottom: 14 }}>
          בחירת סיסמה חדשה
        </h2>

        {done ? (
          <>
            <div className="warn gold">הסיסמה עודכנה בהצלחה ✅</div>
            <button className="btn primary block" onClick={clearRecovery}>
              המשך לאפליקציה
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            {error && <div className="warn">{error}</div>}
            <div className="field">
              <label>סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="field">
              <label>אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                dir="ltr"
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn primary block" disabled={busy}>
              {busy ? "מעדכן…" : "עדכון סיסמה"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
