// ── DataSourceBadge component ─────────────────────────────────────────────
// Shows a pill badge indicating whether a field came from the AI pipeline
// or was human-modified. For modified fields, renders an inline diff:
//   [old value, struck through] → [new value]

import { Sparkles, PenLine } from "lucide-react";
import type { DataField } from "../../types/dataProvenance";

interface DataSourceBadgeProps<T> {
  field: DataField<T>;
  /** How to render T for diff display. Defaults to String(value). */
  renderValue?: (value: T) => string;
  /** If true, the diff is shown inline below the badge. Default true. */
  showDiff?: boolean;
}

export function DataSourceBadge<T>({
  field,
  renderValue,
  showDiff = true,
}: DataSourceBadgeProps<T>) {
  const render =
    renderValue ??
    ((v: T) => {
      if (Array.isArray(v)) return (v as unknown[]).join(", ");
      return String(v);
    });

  if (field.source === "ai") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 select-none">
        <Sparkles className="h-3 w-3" />
        AI Generated
      </span>
    );
  }

  // Modified
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 select-none w-fit">
        <PenLine className="h-3 w-3" />
        Modified
      </span>
      {showDiff && field.originalValue !== undefined && (
        <span className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
          <span
            className="line-through text-red-500/70 dark:text-red-400/60 max-w-xs truncate"
            title={render(field.originalValue)}
          >
            {render(field.originalValue)}
          </span>
          <span className="text-muted-foreground/50">→</span>
          <span
            className="text-green-700 dark:text-green-400 font-medium max-w-xs truncate"
            title={render(field.value)}
          >
            {render(field.value)}
          </span>
        </span>
      )}
    </span>
  );
}

// ── Compact inline variant (just the pill, no diff) ───────────────────────
export function DataSourcePill<T>({ field }: { field: DataField<T> }) {
  return <DataSourceBadge field={field} showDiff={false} />;
}
