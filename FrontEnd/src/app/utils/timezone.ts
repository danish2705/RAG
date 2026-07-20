const ZONE_LABEL_OVERRIDES: Record<string, string> = {
  "Asia/Kolkata": "IST",
};

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function resolveZoneLabel(timeZone: string, date: Date): string {
  if (ZONE_LABEL_OVERRIDES[timeZone]) return ZONE_LABEL_OVERRIDES[timeZone];
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

export interface FormatTimestampOptions {
  /** Override the detected timezone, e.g. force "Asia/Kolkata" or "America/New_York". */
  timeZone?: string;
  /**
   * "medium" (default): "06 Apr 2024, 02:32 PM IST"
   * "numeric": "06-04-2024, 02:32 PM IST" (dd-mm-yyyy)
   */
  dateStyle?: "medium" | "numeric";
}

/**
 * Formats a date value into the viewer's local timezone, with the correct
 * zone abbreviation appended (auto-detected from the browser/OS — e.g. IST
 * for someone in India, EST/EDT for someone on the US east coast).
 */
export function formatTimestamp(
  dateVal: string | number | Date | undefined | null,
  options: FormatTimestampOptions = {},
): string {
  if (!dateVal) return "N/A";

  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(date.getTime())) {
    // Not a parseable date (e.g. an already-formatted display string) —
    // return as-is rather than guessing.
    return String(dateVal);
  }

  const timeZone = options.timeZone || detectTimeZone();
  const zoneLabel = resolveZoneLabel(timeZone, date);

  if (options.dateStyle === "numeric") {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const dd = get("day");
    const mm = get("month");
    const yyyy = get("year");
    const hh = get("hour");
    const min = get("minute");
    const dayPeriod = get("dayPeriod");

    return `${dd}-${mm}-${yyyy}, ${hh}:${min} ${dayPeriod} ${zoneLabel}`;
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${formatted} ${zoneLabel}`;
}

/** The viewer's detected IANA timezone name, e.g. "Asia/Kolkata". */
export const detectedTimeZone = detectTimeZone();
