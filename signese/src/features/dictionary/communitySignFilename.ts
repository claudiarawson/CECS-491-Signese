/**
 * Sanitize a user-entered word for use in Storage filenames (no path traversal, safe charset).
 */
export function sanitizeWordForFilename(word: string): string {
  const base = word
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "sign";
}

/**
 * Unique, filesystem-safe name for a community sign video in Storage.
 * Pattern: communitysign_{timestamp}_{sanitizedWord}.mp4
 */
export function buildCommunityVideoFileName(word: string): string {
  const ts = Date.now();
  const safe = sanitizeWordForFilename(word);
  return `communitysign_${ts}_${safe}.mp4`;
}
