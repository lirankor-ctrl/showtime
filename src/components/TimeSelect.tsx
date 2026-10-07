interface Props {
  value: string; // "HH:mm" or "" (no time)
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const QUARTERS = ["00", "15", "30", "45"];

// Hour + minute selects limited to 15-minute steps. Native <select>s are used
// because iOS ignores `step` on <input type="time">. A previously saved
// off-grid minute (e.g. 19:10) is kept as an extra option so it's preserved
// until the user actively changes it.
export default function TimeSelect({ value, onChange }: Props) {
  const [hour = "", minute = ""] = value ? value.split(":") : [];
  const minutes =
    minute && !QUARTERS.includes(minute) ? [...QUARTERS, minute].sort() : QUARTERS;

  function onHour(h: string) {
    onChange(h ? `${h}:${minute || "00"}` : "");
  }

  return (
    <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <select
        aria-label="שעה"
        value={hour}
        onChange={(e) => onHour(e.target.value)}
        style={{ flex: 1 }}
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span aria-hidden>:</span>
      <select
        aria-label="דקות"
        value={minute}
        disabled={!hour}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        style={{ flex: 1 }}
      >
        {!hour && <option value="">--</option>}
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
