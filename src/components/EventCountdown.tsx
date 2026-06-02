import { useEffect, useMemo, useState } from "react";
import { toDate } from "../utils/dates";

interface Props {
  date: string; // YYYY-MM-DD (expected to be today)
  time: string; // HH:mm
}

const pad = (n: number) => String(n).padStart(2, "0");

// Live HH:MM:SS countdown for an event happening today, updating every second.
export default function EventCountdown({ date, time }: Props) {
  const target = useMemo(() => toDate(date, time).getTime(), [date, time]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.floor((target - now) / 1000);

  if (remaining <= 0) {
    // Within the first minute say it's starting; afterwards it's underway.
    const justStarted = remaining > -60;
    return (
      <div className="countdown-live started">
        {justStarted ? "האירוע מתחיל עכשיו" : "האירוע מתקיים כעת"} 🎭
      </div>
    );
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="countdown-live">
      <span className="cd-label">האירוע מתחיל בעוד</span>
      <div className="cd-clock" dir="ltr">
        <span className="cd-unit">
          <b>{pad(hours)}</b>
          <em>שעות</em>
        </span>
        <i className="cd-sep">:</i>
        <span className="cd-unit">
          <b>{pad(minutes)}</b>
          <em>דקות</em>
        </span>
        <i className="cd-sep">:</i>
        <span className="cd-unit">
          <b>{pad(seconds)}</b>
          <em>שניות</em>
        </span>
      </div>
    </div>
  );
}
