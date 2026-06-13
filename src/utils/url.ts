// Lightweight URL validation/normalization for user-entered discovery links.
// We only accept http(s) links and always store an absolute URL so the link
// opens cleanly in the external browser.

/**
 * Normalize a user-typed URL: trims it and prepends https:// when no scheme is
 * present. Returns null if the result isn't a valid http(s) URL.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // A bare scheme with no host (e.g. "https://") is not a usable link.
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** True when the input can be normalized to a valid http(s) URL. */
export function isValidUrl(input: string): boolean {
  return normalizeUrl(input) !== null;
}
