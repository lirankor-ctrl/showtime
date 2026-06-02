import { useNavigate } from "react-router-dom";
import type { ShowEvent } from "../types";
import { category } from "../utils/categories";
import { formatShort, countdownLabel, isPast } from "../utils/dates";
import { useApp } from "../store/AppStore";
import RatingStars from "./RatingStars";

export default function EventCard({ event }: { event: ShowEvent }) {
  const navigate = useNavigate();
  const { posterUrls } = useApp();
  const c = category(event.category);
  const past = isPast(event.date);
  const poster = event.posterImagePath ? posterUrls[event.id] : "";

  return (
    <button className="event-card fade-in" onClick={() => navigate(`/events/${event.id}`)}>
      <span className="accent" style={{ background: c.color }} />
      <span className="body">
        <span className="title">{event.title}</span>
        <span className="meta">
          <span>
            {c.icon} {c.label}
          </span>
          <span>📅 {formatShort(event.date)}</span>
          {event.time && <span>🕘 {event.time}</span>}
          {event.city && <span>📍 {event.city}</span>}
        </span>
        {past && event.rating ? (
          <span style={{ marginTop: 4, display: "inline-block" }}>
            <RatingStars value={event.rating} size="0.95rem" />
          </span>
        ) : (
          <span className="meta" style={{ color: c.color }}>
            {countdownLabel(event.date)}
          </span>
        )}
      </span>
      {poster && (
        <span className="poster-thumb" aria-hidden>
          <img src={poster} alt="" loading="lazy" />
        </span>
      )}
    </button>
  );
}
