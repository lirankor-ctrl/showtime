import { useEffect, useState } from "react";
import { useAuth } from "../store/AuthStore";
import { useApp } from "../store/AppStore";
import {
  hasLocalData,
  markMigrated,
  migrationDone,
  runMigration,
} from "../utils/migration";

type Phase = "hidden" | "ask" | "working" | "done" | "error";

// Offers a one-time import of legacy on-device data after the user logs in.
export default function MigrationPrompt() {
  const { user } = useAuth();
  const { reload } = useApp();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user || migrationDone(user.id)) return;
      const has = await hasLocalData();
      if (active && has) setPhase("ask");
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (phase === "hidden" || !user) return null;

  async function doMigrate() {
    setPhase("working");
    try {
      const r = await runMigration(user!.id);
      setSummary(`${r.events} אירועים, ${r.subscriptions} מנויים ו-${r.photos} תמונות הועברו.`);
      await reload();
      setPhase("done");
    } catch {
      setPhase("error");
    }
  }

  function decline() {
    // Respect the choice — don't ask again on this device for this user.
    markMigrated(user!.id);
    setPhase("hidden");
  }

  return (
    <div className="modal-backdrop">
      <div className="modal card fade-in">
        <div className="center" style={{ fontSize: "2.4rem" }}>📦</div>
        {phase === "ask" && (
          <>
            <h2 className="center" style={{ fontSize: "1.15rem" }}>
              מצאנו מידע מקומי במכשיר
            </h2>
            <p className="muted center">האם להעביר אותו לחשבון שלך?</p>
            <div className="btn-row" style={{ marginTop: 8 }}>
              <button className="btn primary block" onClick={doMigrate}>
                כן, העבירו
              </button>
              <button className="btn ghost block" onClick={decline}>
                לא, תודה
              </button>
            </div>
          </>
        )}
        {phase === "working" && (
          <>
            <div className="spinner" />
            <p className="center muted">מעביר את הנתונים…</p>
          </>
        )}
        {phase === "done" && (
          <>
            <h2 className="center" style={{ fontSize: "1.15rem" }}>הנתונים הועברו 🎉</h2>
            <p className="muted center">{summary}</p>
            <button className="btn primary block" onClick={() => setPhase("hidden")}>
              מצוין
            </button>
          </>
        )}
        {phase === "error" && (
          <>
            <h2 className="center" style={{ fontSize: "1.15rem" }}>ההעברה נכשלה</h2>
            <p className="muted center">אפשר לנסות שוב מאוחר יותר מתוך ההגדרות.</p>
            <button className="btn ghost block" onClick={() => setPhase("hidden")}>
              סגירה
            </button>
          </>
        )}
      </div>
    </div>
  );
}
