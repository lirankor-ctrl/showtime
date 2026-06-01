interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
}

// Read-only when no onChange is provided; interactive otherwise.
export default function RatingStars({ value, onChange, size }: Props) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="stars" style={size ? { fontSize: size } : undefined}>
      {stars.map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            aria-label={`דירוג ${n}`}
            className={n <= value ? "" : "empty"}
            onClick={() => onChange(n === value ? 0 : n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= value ? "" : "empty"}>
            ★
          </span>
        ),
      )}
    </span>
  );
}
