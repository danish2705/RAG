import { Sparkles } from "lucide-react";

const MODIFIED_BADGE_CLASS =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border select-none bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";

/** Small "Modified" pill shown next to a field/card whose AI-generated value was edited. */
export function ModifiedBadge() {
  return (
    <span className={MODIFIED_BADGE_CLASS}>
      <Sparkles className="h-3 w-3" />
      Modified
    </span>
  );
}

/**
 * Renders a ModifiedBadge only when `enabled` is true and `current` differs
 * from `original`. Arrays are compared by value (via JSON.stringify) so this
 * works for both single-value and multi-line/list fields.
 */
export function ModifiedStatus({
  original,
  current,
  enabled,
}: {
  original: unknown;
  current: unknown;
  enabled: boolean;
}) {
  if (!enabled) return null;

  const changed =
    Array.isArray(original) || Array.isArray(current)
      ? JSON.stringify(original) !== JSON.stringify(current)
      : original !== current;

  if (!changed) return null;
  return <ModifiedBadge />;
}