// Shared "due in N days" phrasing used both when composing a notification
// message server-side. Mirrors the frontend's due-date formatting so the
// bell dropdown and any backend-composed text stay consistent.
export function formatDueLabel(dueDate: unknown): string | null {
  if (!dueDate) return null;
  const date = new Date(dueDate as string);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfDue = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (diffDays === 0) return `due today (${dateLabel})`;
  if (diffDays === 1) return `due tomorrow (${dateLabel})`;
  if (diffDays > 1) return `due in ${diffDays} days (${dateLabel})`;
  if (diffDays === -1) return `overdue by 1 day (was due ${dateLabel})`;
  return `overdue by ${Math.abs(diffDays)} days (was due ${dateLabel})`;
}
