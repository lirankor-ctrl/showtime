interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
}

// Distinct glyphs for filled vs empty so inactive stars always read as empty
// (a filled outline ☆ vs solid ★), and the U+FE0E variation selector forces
// TEXT presentation — otherwise iOS renders ★ as a colour emoji, ignoring our
// CSS colour and making the empty stars look like a confusing duplicate set.
const FILLED = "★︎"; // ★ + text-presentation selector
const EMPTY = "☆︎"; // ☆ + text-presentation selector

// Read-only when no onChange is provided; interactive otherwise.
export default function RatingStars({ value, onChange, size }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars" style={size ? { fontSize: size } : undefined}>
      {stars.map((n) => {
        const on = n <= value;
        return onChange ? (
          <button
            key={n}
            type="button"
            aria-label={`דירוג ${n}`}
            className={on ? "" : "empty"}
            onClick={() => onChange(n === value ? 0 : n)}
          >
            {on ? FILLED : EMPTY}
          </button>
        ) : (
          <span key={n} className={on ? "" : "empty"}>
            {on ? FILLED : EMPTY}
          </span>
        );
      })}
    </span>
  );
}
