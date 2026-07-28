import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const ACCEPT_CLASS =
  "flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50";
const REJECT_CLASS =
  "flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50";

export interface DecisionActionProps {
  /** Label while `isLoading` is true, e.g. "Running Impact Assessment...". Defaults to "Accept". */
  acceptLoadingLabel?: string;
  onAccept: () => void;
  acceptDisabled?: boolean;
  /** Highlights the accept button as the chosen decision (used by the CAPA page). */
  acceptSelected?: boolean;

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
 * Assessment, Root Cause, CAPA, and change control equivalent pages: just
 * Accept / Reject. Every field on these pages is directly editable at all
 * times (no separate Override mode to step into first) — Accept simply
 * submits whatever is currently in the form, edited or not.
 */
export function DecisionAction({
  acceptLoadingLabel = "Accept",
  onAccept,
  acceptDisabled,
  acceptSelected,
  onReject,
  rejectDisabled,
  isLoading = false,
  error,
  errorTitle = "Something went wrong",
  footerText = "Your decision will be logged in the audit trail. Any edits you made are saved and sent along with your decision.",
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
            disabled={acceptDisabled ?? isLoading}
            className={`${ACCEPT_CLASS} ${acceptSelected ? "ring-2 ring-offset-2 ring-green-500" : ""}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {acceptLoadingLabel}
              </>
            ) : (
              "Accept"
            )}
          </Button>

          <Button
            onClick={onReject}
            disabled={rejectDisabled ?? isLoading}
            className={REJECT_CLASS}
          >
            Reject
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
