// Read-only access to the curated event-discovery catalogue (external_links).
import { supabase } from "../lib/supabase";
import { dbError } from "../lib/errors";

export interface ExternalLink {
  id: string;
  category: string;
  title: string;
  description?: string;
  url: string;
}

/** Active links for one discovery category, ordered for display. */
export async function fetchLinksByCategory(
  category: string,
): Promise<ExternalLink[]> {
  const { data, error } = await supabase
    .from("external_links")
    .select("id, category, title, description, url")
    .eq("category", category)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw dbError(error, "טעינת הקישורים נכשלה");
  return (data ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description ?? undefined,
    url: r.url,
  }));
}
