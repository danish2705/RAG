import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const BADGE_CLASS =
  "ml-auto bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 text-sm px-3 py-1";

export interface OverrideBarProps {
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  onCancelOverride: () => void;
  cancelDisabled?: boolean;
  /** Text on the confirmed badge once an override has been saved. */
  overriddenLabel?: string;
}

/**
 * The "Editing" / "Overridden" status row shared by the AI Recommendation,
 * Impact Assessment, Root Cause, and CAPA pages. Shows a "Cancel Override"
 * button while editing, and an "Overridden" badge once an override has been
 * confirmed.
 */
export function OverrideBar({
  isOverrideEditing,
  overrideConfirmed,
  onCancelOverride,
  cancelDisabled = false,
  overriddenLabel = "Overridden",
}: OverrideBarProps) {
  if (!isOverrideEditing && !overrideConfirmed) return null;

  return (
    <div className="mb-6 flex items-center gap-3 justify-end">
      {isOverrideEditing ? (
        <>
          <Badge className={BADGE_CLASS}>Editing</Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
            onClick={onCancelOverride}
            disabled={cancelDisabled}
          >
            Cancel Override
          </Button>
        </>
      ) : (
        <Badge className={BADGE_CLASS}>{overriddenLabel}</Badge>
      )}
    </div>
  );
}