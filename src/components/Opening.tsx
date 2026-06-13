import { useEffect, useState } from "react";

// Premium theatrical opening sequence: dark stage → closed red curtains with a
// golden spotlight → the SHOW TIME title and a Dr. Seuss quote → the curtains
// part from the center to reveal the app that is already loaded behind them.
//
// It plays ONCE per app launch (a fresh page/PWA open mounts App once). Route
// navigation never remounts App, so it never replays while browsing. Honors
// prefers-reduced-motion by collapsing to a quick fade.

const FULL_DURATION = 3400; // ms — matches the CSS animation timeline
const REDUCED_DURATION = 600;

export default function Opening() {
  const [done, setDone] = useState(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const t = window.setTimeout(
      () => setDone(true),
      reduced ? REDUCED_DURATION : FULL_DURATION,
    );
    return () => window.clearTimeout(t);
  }, [reduced]);

  if (done) return null;

  return (
    <div className={`opening ${reduced ? "reduced" : ""}`} aria-hidden>
      <div className="opening-bg" />
      <div className="opening-spot" />

      <div className="opening-curtain left" />
      <div className="opening-curtain right" />

      <div className="opening-center">
        <img className="opening-logo" src="/LOGO.jpg" alt="" />
        <div className="opening-title">SHOW TIME</div>
        <div className="opening-sub">המופע עומד להתחיל</div>
        <blockquote className="opening-quote">
          „אם יוצאים מגיעים למקומות נפלאים”
          <cite>ד״ר סוס</cite>
        </blockquote>
      </div>
    </div>
  );
}
