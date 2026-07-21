const ZONE_LABEL_OVERRIDES: Record<string, string> = {
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST", // legacy alias for Asia/Kolkata
};

const OFFSET_LABEL_FALLBACK: Record<number, string> = {
  330: "IST", // India, +5:30
};

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// True for anything Intl gives us that's really just a numeric offset in
// disguise ("GMT+5:30", "UTC-05:00", "GMT", etc.) rather than a proper
// named abbreviation like "IST" or "EST".
function isRawOffsetLabel(label: string): boolean {
  return /^(GMT|UTC)([+-]\d{1,2}(:\d{2})?)?$/.test(label.trim());
}

// Minutes east of UTC for the given zone/date (handles DST correctly by
// diffing the zone's wall-clock time against the same instant's UTC time).
function offsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

function resolveZoneLabel(timeZone: string, date: Date): string {
  if (ZONE_LABEL_OVERRIDES[timeZone]) return ZONE_LABEL_OVERRIDES[timeZone];

  let label = timeZone;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    label = tzPart?.value ?? timeZone;
  } catch {
    return timeZone;
  }

  // Intl only gave us a raw offset (common for India, some rarer zones) —
  // try to resolve a proper abbreviation from the offset itself.
  if (isRawOffsetLabel(label)) {
    try {
      const minutes = offsetMinutes(timeZone, date);
      if (OFFSET_LABEL_FALLBACK[minutes]) return OFFSET_LABEL_FALLBACK[minutes];
    } catch {
      // fall through and return whatever Intl gave us
    }
  }

  return label;
}

export interface FormatTimestampOptions {
  /** Override the detected timezone, e.g. force "Asia/Kolkata" or "America/New_York". */
  timeZone?: string;
  /**
   * "numeric" (default): "06-04-2024, 02:32 PM IST" (dd-mm-yyyy)
   * "medium": "06 Apr 2024, 02:32 PM IST"
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

  if (options.dateStyle === "medium") {
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

  // Default: "numeric" (dd-mm-yyyy).
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dd = get("day");
  const mm = get("month");
  const yyyy = get("year");
  const hh = get("hour");
  const min = get("minute");
  const dayPeriod = get("dayPeriod");

  return `${dd}-${mm}-${yyyy}, ${hh}:${min} ${dayPeriod} ${zoneLabel}`;
}

/** The viewer's detected IANA timezone name, e.g. "Asia/Kolkata". */
export const detectedTimeZone = detectTimeZone();
