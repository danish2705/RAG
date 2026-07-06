import type { ReactNode } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const ACCEPT_CLASS =
  "flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50";
const OVERRIDE_CLASS = "flex-1 disabled:opacity-50";
const SAVE_CLASS = "flex-1 bg-orange-600 hover:bg-orange-700 text-white";
const REJECT_CLASS =
  "flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50";

export interface DecisionActionProps {
  /** Label on the accept button in its idle state, e.g. "Accept Classification". */
  acceptLabel: string;
  /** Label while `isLoading` is true. Defaults to `acceptLabel`. */
  acceptLoadingLabel?: string;
  onAccept: () => void;
  acceptDisabled?: boolean;
  /** Highlights the accept button as the chosen decision (used by the CAPA page). */
  acceptSelected?: boolean;

  overrideLabel: string;
  onOverrideClick: () => void;
  onSaveChanges: () => void;
  isOverrideEditing: boolean;
  overrideDisabled?: boolean;
  overrideSelected?: boolean;
  saveChangesDisabled?: boolean;

  rejectLabel: string;
  onReject: () => void;
  rejectDisabled?: boolean;

  /** Shared loading flag driving default disabled states + the accept button spinner. */
  isLoading?: boolean;
  error?: string | null;
  errorTitle?: string;
  footerText?: ReactNode;
}

/**
 * The "Decision Required" card shared by the AI Recommendation, Impact
 * Assessment, Root Cause, and CAPA pages: Accept / Override / Save Changes /
 * Reject buttons, an optional inline error banner, and a footer note.
 */
export function DecisionAction({
  acceptLabel,
  acceptLoadingLabel,
  onAccept,
  acceptDisabled,
  acceptSelected,
  overrideLabel,
  onOverrideClick,
  onSaveChanges,
  isOverrideEditing,
  overrideDisabled,
  overrideSelected,
  saveChangesDisabled,
  rejectLabel,
  onReject,
  rejectDisabled,
  isLoading = false,
  error,
  errorTitle = "Something went wrong",
  footerText = "Your decision will be logged in the audit trail.",
}: DecisionActionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decision Required</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{errorTitle}</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onAccept}
            disabled={acceptDisabled ?? (isLoading || isOverrideEditing)}
            className={`${ACCEPT_CLASS} ${acceptSelected ? "ring-2 ring-offset-2 ring-green-500" : ""}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {acceptLoadingLabel ?? acceptLabel}
              </>
            ) : (
              acceptLabel
            )}
          </Button>

          {isOverrideEditing ? (
            <Button
              onClick={onSaveChanges}
              disabled={saveChangesDisabled ?? isLoading}
              className={SAVE_CLASS}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={onOverrideClick}
              variant="outline"
              disabled={overrideDisabled ?? isLoading}
              className={`${OVERRIDE_CLASS} ${overrideSelected ? "ring-2 ring-offset-2 ring-orange-500" : ""}`}
            >
              {overrideLabel}
            </Button>
          )}

          <Button
            onClick={onReject}
            disabled={rejectDisabled ?? isLoading}
            className={REJECT_CLASS}
          >
            {rejectLabel}
          </Button>
        </div>

        {footerText && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {footerText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}