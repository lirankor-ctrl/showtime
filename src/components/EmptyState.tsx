import { type ReactNode } from "react";

interface Props {
  glyph: string;
  title: string;
  text?: string;
  action?: ReactNode;
}

export default function EmptyState({ glyph, title, text, action }: Props) {
  return (
    <div className="empty fade-in">
      <div className="glyph">{glyph}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
