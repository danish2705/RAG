// Shared due-date helpers used by the Submit-for-Approval dialog (default +7
// days, editable), the Approvals table (Due Date column), and the
// notification dropdown ("due in 3 days" phrasing).

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// "YYYY-MM-DD" using local calendar fields (not UTC), so the selected day
// doesn't shift across timezones when it's sent to the API as a date-only
// value. Mirrors the same helper in DaterangePicker.tsx.
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Default due date shown when the Submit-for-Approval dialog opens. */
export function getDefaultDueDate(): Date {
  return addDays(new Date(), 7);
}

// Pulls the "YYYY-MM-DD" calendar date out of whatever the API gives back
// (a date-only string, or a full ISO timestamp), without letting timezone
// conversion shift it to the previous/next day — a due date is a day, not
// a precise instant.
function toIsoDateOnly(
  value: string | number | Date | null | undefined,
): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toDateKey(value);
  }
  const str = String(value);
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : toDateKey(parsed);
}

function parseDateOnly(
  value: string | number | Date | null | undefined,
): Date | null {
  const iso = toIsoDateOnly(value);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Aug 10, 2026" */
export function formatDueDate(
  value: string | number | Date | null | undefined,
): string {
  const date = parseDateOnly(value);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Due in 3 days (Aug 10, 2026)" / "Due today (…)" / "Overdue by 2 days (…)" */
export function formatDueLabel(
  value: string | number | Date | null | undefined,
): string | null {
  const date = parseDateOnly(value);
  if (!date) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (date.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dateLabel = formatDueDate(value);

  if (diffDays === 0) return `Due today (${dateLabel})`;
  if (diffDays === 1) return `Due tomorrow (${dateLabel})`;
  if (diffDays > 1) return `Due in ${diffDays} days (${dateLabel})`;
  if (diffDays === -1) return `Overdue by 1 day (${dateLabel})`;
  return `Overdue by ${Math.abs(diffDays)} days (${dateLabel})`;
}
