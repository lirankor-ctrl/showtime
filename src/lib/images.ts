// Reusable signed-URL helpers for images in the private `event-photos` bucket.
// The raw storage path is NOT a usable <img src> — a short-lived signed URL is
// required. This mirrors the proven approach used by PhotoGallery.
import { PHOTO_BUCKET, supabase } from "./supabase";

const SIGNED_TTL = 60 * 60; // 1 hour

/** Create a signed URL for a single private-bucket path ("" on failure). */
export async function getSignedImageUrl(path: string): Promise<string> {
  if (!path) return "";
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  if (import.meta.env.DEV) {
    console.debug("[SHOW TIME] signed URL:", { path, signedUrl: data?.signedUrl, error });
  }
  return data?.signedUrl ?? "";
}

/**
 * Sign several paths at once, returning a map keyed by the caller's own key
 * (e.g. event id). Failed/empty signatures are omitted.
 */
export async function getSignedImageUrls(
  entries: Array<[key: string, path: string]>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    entries.map(async ([key, path]) => {
      const url = await getSignedImageUrl(path);
      if (url) out[key] = url;
    }),
  );
  return out;
}
