import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useApp } from "../store/AppStore";
import AppHeader from "../components/AppHeader";
import EventCard from "../components/EventCard";
import EmptyState from "../components/EmptyState";
import CategoryBadge from "../components/CategoryBadge";
import EventCountdown from "../components/EventCountdown";
import { useToast } from "../components/useToast";
import { todayStr, formatLong, countdownLabel, isToday } from "../utils/dates";
import { shareEvent } from "../utils/share";

export default function Home() {
  const { events, posterUrls } = useApp();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const { hero, upcoming, pastCount } = useMemo(() => {
    const today = todayStr();
    const future = events.filter((e) => e.date >= today);
    const past = events.filter((e) => e.date < today);
    return {
      hero: future[0],
      upcoming: future.slice(1),
      pastCount: past.length,
    };
  }, [events]);

  async function onShare() {
    if (!hero) return;
    const res = await shareEvent(hero);
    if (res === "copied") showToast("הפרטים הועתקו ללוח 📋");
    else if (res === "shared") showToast("שותף בהצלחה 🎉");
  }

  return (
    <div className="page">
      <AppHeader title="SHOW TIME" subtitle="יומן התרבות שלי" />

      {!hero ? (
        <EmptyState
          glyph="🎭"
          title="הבמה ריקה כרגע"
          text="הוסיפו את האירוע הבא שלכם — הצגה, הופעה, סרט או כל חוויה תרבותית."
          action={
            <Link to="/events/new" className="btn primary">
              ＋ הוספת אירוע
            </Link>
          }
        />
      ) : (
        <>
          <div className="hero fade-in" onClick={() => navigate(`/events/${hero.id}`)}>
            <div className="stage-glow" aria-hidden />
            <div className="hero-top">
              <div className="hero-top-main">
                <div className="eyebrow">האירוע הקרוב שלך</div>
                <h2>{hero.title}</h2>
                {isToday(hero.date) && hero.time ? (
                  <EventCountdown date={hero.date} time={hero.time} />
                ) : (
                  <span className="countdown">{countdownLabel(hero.date)}</span>
                )}
                <div style={{ marginBottom: 6 }}>
                  <CategoryBadge id={hero.category} />
                </div>
              </div>
              {hero.posterImagePath && posterUrls[hero.id] && (
                <div className="hero-poster" aria-hidden>
                  <img src={posterUrls[hero.id]} alt="" />
                </div>
              )}
            </div>

            <div className="detail-grid">
              <div className="detail">
                <span className="label">תאריך</span>
                <span className="value">{formatLong(hero.date)}</span>
              </div>
              {hero.time && (
                <div className="detail">
                  <span className="label">שעה</span>
                  <span className="value">{hero.time}</span>
                </div>
              )}
              {(hero.venue || hero.city) && (
                <div className="detail">
                  <span className="label">מיקום</span>
                  <span className="value">
                    {[hero.venue, hero.city].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {hero.seats && (
                <div className="detail">
                  <span className="label">מקומות</span>
                  <span className="value">{hero.seats}</span>
                </div>
              )}
              {hero.ticketsCount ? (
                <div className="detail">
                  <span className="label">כרטיסים</span>
                  <span className="value">{hero.ticketsCount}</span>
                </div>
              ) : null}
            </div>

            {hero.notes && (
              <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
                📝 {hero.notes}
              </p>
            )}

            <div className="btn-row" style={{ marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
              <Link to={`/events/${hero.id}`} className="btn gold">
                לפרטים המלאים
              </Link>
              <button className="btn ghost" onClick={onShare}>
                🔗 שיתוף
              </button>
              {hero.ticketUrl && (
                <a className="btn ghost" href={hero.ticketUrl} target="_blank" rel="noreferrer">
                  🎟️ כרטיסים
                </a>
              )}
            </div>
          </div>

          {upcoming.length > 0 && (
            <>
              <h2 className="section-title">🎟️ אירועים קרובים</h2>
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </>
          )}
        </>
      )}

      {pastCount > 0 && (
        <Link to="/memories" className="btn block ghost" style={{ marginTop: 16 }}>
          📖 לארכיון הזיכרונות ({pastCount})
        </Link>
      )}

      <Link to="/events/new" className="fab" aria-label="הוספת אירוע">
        +
      </Link>
      {toast}
    </div>
  );
}
