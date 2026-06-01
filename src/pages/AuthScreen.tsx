import { useState } from "react";
import { useAuth } from "../store/AuthStore";

type Mode = "login" | "register" | "forgot";

export default function AuthScreen() {
  const { signIn, signUp, sendReset } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        // On success the auth listener swaps in the app — nothing else to do.
      } else if (mode === "register") {
        if (!fullName.trim()) throw new Error("יש להזין שם מלא");
        const { needsConfirm } = await signUp(email.trim(), password, fullName.trim());
        if (needsConfirm) {
          setSuccess("נשלח אליכם מייל לאימות הכתובת. אשרו אותו ואז התחברו.");
          setMode("login");
        }
      } else {
        await sendReset(email.trim());
        setSuccess("אם הכתובת קיימת, נשלח אליה קישור לאיפוס הסיסמה.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: "התחברות",
    register: "הרשמה",
    forgot: "איפוס סיסמה",
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-in">
        <img className="auth-logo" src="/LOGO.jpg" alt="SHOW TIME" />
        <h1 className="auth-title">SHOW TIME</h1>
        <p className="muted center" style={{ marginTop: 0 }}>יומן התרבות שלי</p>

        <div className="chip-row" style={{ justifyContent: "center", marginBottom: 8 }}>
          <button
            className={`chip ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            התחברות
          </button>
          <button
            className={`chip ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            הרשמה
          </button>
        </div>

        <h2 className="center" style={{ fontSize: "1.1rem", margin: "6px 0 14px" }}>
          {titles[mode]}
        </h2>

        {error && <div className="warn">{error}</div>}
        {success && <div className="warn gold">{success}</div>}

        <form onSubmit={onSubmit}>
          {mode === "register" && (
            <div className="field">
              <label>שם מלא</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ישראל ישראלי"
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <label>אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              dir="ltr"
            />
          </div>

          {mode !== "forgot" && (
            <div className="field">
              <label>סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                dir="ltr"
              />
            </div>
          )}

          <button type="submit" className="btn primary block" disabled={busy}>
            {busy
              ? "רגע…"
              : mode === "login"
                ? "כניסה"
                : mode === "register"
                  ? "יצירת חשבון"
                  : "שליחת קישור איפוס"}
          </button>
        </form>

        <div className="center" style={{ marginTop: 14, fontSize: "0.85rem" }}>
          {mode === "login" ? (
            <button className="link-btn" onClick={() => switchMode("forgot")}>
              שכחתי סיסמה
            </button>
          ) : (
            <button className="link-btn" onClick={() => switchMode("login")}>
              ← חזרה להתחברות
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
