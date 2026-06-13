// Per-user, private discovery links (user_external_links). RLS scopes every
// query to the signed-in user, so these are never visible to anyone else.
import { supabase } from "../lib/supabase";
import { dbError } from "../lib/errors";

export interface UserLink {
  id: string;
  category: string;
  title: string;
  description?: string;
  url: string;
}

export interface UserLinkDraft {
  category: string;
  title: string;
  description?: string;
  url: string;
}

function fromRow(r: {
  id: string;
  category: string;
  title: string;
  description: string | null;
  url: string;
}): UserLink {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description ?? undefined,
    url: r.url,
  };
}

/** The signed-in user's personal links for one category, oldest first. */
export async function fetchUserLinksByCategory(
  category: string,
): Promise<UserLink[]> {
  const { data, error } = await supabase
    .from("user_external_links")
    .select("id, category, title, description, url")
    .eq("category", category)
    .order("created_at", { ascending: true });
  if (error) throw dbError(error, "טעינת הקישורים האישיים נכשלה");
  return (data ?? []).map(fromRow);
}

export async function insertUserLink(
  userId: string,
  draft: UserLinkDraft,
): Promise<UserLink> {
  const { data, error } = await supabase
    .from("user_external_links")
    .insert({
      user_id: userId,
      category: draft.category,
      title: draft.title,
      description: draft.description ?? null,
      url: draft.url,
    })
    .select("id, category, title, description, url")
    .single();
  if (error) throw dbError(error, "שמירת הקישור נכשלה");
  return fromRow(data);
}

export async function updateUserLink(
  id: string,
  draft: Omit<UserLinkDraft, "category">,
): Promise<UserLink> {
  const { data, error } = await supabase
    .from("user_external_links")
    .update({
      title: draft.title,
      description: draft.description ?? null,
      url: draft.url,
    })
    .eq("id", id)
    .select("id, category, title, description, url")
    .single();
  if (error) throw dbError(error, "עדכון הקישור נכשל");
  return fromRow(data);
}

export async function deleteUserLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("user_external_links")
    .delete()
    .eq("id", id);
  if (error) throw dbError(error, "מחיקת הקישור נכשלה");
}
