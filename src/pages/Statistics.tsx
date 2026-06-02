import { useEffect, useMemo, useState } from "react";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EmptyState from "../components/EmptyState";
import { Link } from "react-router-dom";
import { fetchUserPhotoEventIds } from "../data/photos";
import { computeStats } from "../utils/stats";

export default function Statistics() {
  const { events, subscriptions } = useApp();
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  const [totalPhotos, setTotalPhotos] = useState(0);

  useEffect(() => {
    let active = true;
    fetchUserPhotoEventIds()
      .then((ids) => {
        if (!active) return;
        const counts: Record<string, number> = {};
        for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
        setPhotoCounts(counts);
        setTotalPhotos(ids.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [events]);

  const stats = useMemo(
    () => computeStats(events, subscriptions, photoCounts, totalPhotos),
    [events, subscriptions, photoCounts, totalPhotos],
  );

  if (events.length === 0) {
    return (
      <div className="page">
        <AppHeader title="הסטטיסטיקות שלי" subtitle="תובנות על הפעילות התרבותית שלך" />
        <EmptyState
          glyph="📊"
          title="עדיין אין נתונים"
          text="הוסיפו אירועים כדי לראות תובנות, גרפים והישגים על הפעילות התרבותית שלכם."
          action={
            <Link to="/events/new" className="btn primary">
              ＋ הוספת אירוע
            </Link>
          }
        />
      </div>
    );
  }

  const maxMonth = Math.max(1, ...stats.byMonth.map((m) => m.count));
  const maxCat = Math.max(1, ...stats.categoryBreakdown.map((c) => c.count));

  return (
    <div className="page">
      <AppHeader title="הסטטיסטיקות שלי" subtitle="תובנות על הפעילות התרבותית שלך" />

      {/* General numbers */}
      <div className="stat-grid">
        <Stat value={stats.totalAttended} label="אירועים שחוויתי" />
        <Stat value={stats.thisYear} label="אירועים השנה" />
        <Stat value={stats.thisMonth} label="אירועים החודש" />
        <Stat
          value={stats.avgRating !== null ? `★ ${stats.avgRating.toFixed(1)}` : "—"}
          label="דירוג ממוצע"
        />
        <Stat value={stats.totalPhotos} label="תמונות שהועלו" />
        <Stat value={stats.activeSubscriptions} label="מנויים פעילים" />
        <Stat value={stats.categoriesExperienced} label="קטגוריות שחוויתי" />
        <Stat value={stats.totalEvents} label="סך כל האירועים" />
      </div>

      {/* Category breakdown */}
      {stats.favoriteCategory && (
        <>
          <h2 className="section-title">🎯 פילוח לפי קטגוריה</h2>
          <div className="card">
            {stats.categoryBreakdown
              .filter((c) => c.count > 0)
              .map((c) => (
                <div className="bar-row" key={c.id}>
                  <div className="bar-label">
                    {c.icon} {c.label}
                  </div>
                  <div className="bar-track">
                    <i
                      style={{
                        width: `${(c.count / maxCat) * 100}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                  <div className="bar-value">{c.count}</div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Favorites */}
      <h2 className="section-title">💛 המועדפים שלי</h2>
      <div className="card">
        <FavRow
          label="האירוע המדורג ביותר"
          value={
            stats.topRated
              ? `${stats.topRated.title} (★ ${stats.topRated.rating})`
              : undefined
          }
        />
        <FavRow
          label="האירוע המצולם ביותר"
          value={
            stats.mostPhotographed
              ? `${stats.mostPhotographed.event.title} · ${stats.mostPhotographed.count} תמונות`
              : undefined
          }
        />
        <FavRow
          label="האולם המועדף"
          value={
            stats.favoriteVenue
              ? `${stats.favoriteVenue.name} (★ ${stats.favoriteVenue.avg.toFixed(1)})`
              : undefined
          }
        />
        <FavRow
          label="האולם הנפוץ ביותר"
          value={
            stats.mostVisitedVenue
              ? `${stats.mostVisitedVenue.name} · ${stats.mostVisitedVenue.count} אירועים`
              : undefined
          }
        />
        <FavRow
          label="הקטגוריה המועדפת"
          value={
            stats.favoriteCategory
              ? `${stats.favoriteCategory.icon} ${stats.favoriteCategory.label}`
              : undefined
          }
        />
        <FavRow
          label="העיר הפעילה ביותר"
          value={
            stats.mostActiveCity
              ? `${stats.mostActiveCity.name} · ${stats.mostActiveCity.count} אירועים`
              : undefined
          }
        />
      </div>

      {/* Monthly activity */}
      <h2 className="section-title">📈 פעילות לפי חודש</h2>
      <div className="card">
        {stats.mostActiveMonth && (
          <p className="muted" style={{ marginTop: 0 }}>
            החודש הפעיל ביותר: <b style={{ color: "var(--gold-soft)" }}>{stats.mostActiveMonth.label}</b>
          </p>
        )}
        <div className="month-chart">
          {stats.byMonth.map((m) => (
            <div className="month-col" key={m.month}>
              <div className="month-bar-track">
                <i
                  className="month-bar"
                  style={{ height: `${(m.count / maxMonth) * 100}%` }}
                  title={`${m.label}: ${m.count}`}
                />
              </div>
              <span className="month-name">{m.label.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <h2 className="section-title">🏅 הישגים</h2>
      <div className="achv-grid">
        {stats.achievements.map((a) => (
          <div key={a.id} className={`achv ${a.unlocked ? "unlocked" : "locked"}`}>
            <div className="achv-icon">{a.icon}</div>
            <div className="achv-body">
              <div className="achv-title">{a.title}</div>
              <div className="achv-desc">{a.description}</div>
              <div className="progress" style={{ marginTop: 6 }}>
                <i
                  style={{
                    width: `${(a.current / a.target) * 100}%`,
                    background: a.unlocked ? "var(--gold)" : "var(--muted)",
                  }}
                />
              </div>
              <div className="achv-prog">
                {a.unlocked ? "הושג! ✓" : `${a.current}/${a.target}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function FavRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="fav-row">
      <span className="label">{label}</span>
      <span className="value">{value ?? "אין נתונים עדיין"}</span>
    </div>
  );
}
