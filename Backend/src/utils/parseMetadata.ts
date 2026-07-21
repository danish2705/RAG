// ---------------------------------------------------------------------------
// Parses the semi-structured "Label: value" text block found in the `query`
// column (e.g. "Site: Manufacturing Plant B\nDate/Time Detected: ...\n
// Source System: Equipment System\nEvent Type: Process/Equipment Change\n
// Description: ...") into a plain object suitable for storing in the new
// `metadata` JSONB column.

const LABEL_KEY_MAP: Record<string, string> = {
  site: "site",
  "date/time detected": "date_time_detected",
  "source system": "source_system",
  "event type": "event_type",
  description: "description",
};

// Matches a line that starts with "Some Label:" followed by the rest of the
// line as the value. Label may contain letters, spaces, and "/".
const LABEL_LINE = /^([A-Za-z][A-Za-z /]*):\s*(.*)$/;

export function parseMetadata(query: unknown): Record<string, string> {
  if (typeof query !== "string" || query.trim() === "") return {};

  const lines = query.split("\n");
  const result: Record<string, string> = {};
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") continue;

    const match = line.match(LABEL_LINE);
    const normalizedLabel = match?.[1]?.trim().toLowerCase();
    const mappedKey = normalizedLabel ? LABEL_KEY_MAP[normalizedLabel] : undefined;

    if (match && mappedKey) {
      currentKey = mappedKey;
      result[currentKey] = match[2].trim();
    } else if (currentKey) {
      // Continuation of a multi-line value (most commonly Description).
      result[currentKey] = result[currentKey]
        ? `${result[currentKey]} ${line}`
        : line;
    }
    // Lines before any recognized label are ignored.
  }

  return result;
}