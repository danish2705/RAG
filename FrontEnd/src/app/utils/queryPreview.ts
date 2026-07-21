const DESCRIPTION_MARKER = "Description:\n";
const ACTIONS_MARKER = "\n\nImmediate Actions Taken:";

/** Pulls just the description text out of a full submitted query string. */
export function extractDescription(query: string | null | undefined): string {
  if (!query) return "";

  const idx = query.indexOf(DESCRIPTION_MARKER);
  if (idx === -1) {
    // Doesn't match the expected format (e.g. older data) — fall back to
    // showing the raw string rather than nothing.
    return query.trim();
  }

  let description = query.slice(idx + DESCRIPTION_MARKER.length);

  const actionsIdx = description.indexOf(ACTIONS_MARKER);
  if (actionsIdx !== -1) {
    description = description.slice(0, actionsIdx);
  }

  return description.trim();
}

/** Truncates text to a max number of words, appending "…" if cut short. */
export function truncateWords(text: string, wordLimit: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return text.trim();
  return `${words.slice(0, wordLimit).join(" ")}…`;
}

/** Combined helper: extract the description, then truncate to `wordLimit` words. */
export function getQueryPreview(
  query: string | null | undefined,
  wordLimit = 12,
): string {
  return truncateWords(extractDescription(query), wordLimit);
}
