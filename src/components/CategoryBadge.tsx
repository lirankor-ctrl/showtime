import { category } from "../utils/categories";
import type { CategoryId } from "../types";

export default function CategoryBadge({ id }: { id: CategoryId }) {
  const c = category(id);
  return (
    <span className="badge" style={{ background: c.color }}>
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  );
}
