import { useEffect, useState } from "react";
import { UserCheck, Loader2, AlertCircle, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { fetchApprovers } from "../../services/approvalsApi";

/**
 * Shown at the very end of the Summary page (both Deviation and Change
 * Control) when the user clicks Submit. Lets the user pick — from a fixed
 * dropdown, not free text — who this case should be submitted to for
 * approval. Only that person (or an Admin) will be able to review and
 * approve it.
 *
 * The approver list comes from GET /api/approvers (names seen across saved
 * cases). If that list can't be loaded, or is empty (e.g. a brand-new
 * environment with no cases yet), we fall back to a plain text field so the
 * user is never blocked from submitting.
 */

/** Formats a Date as YYYY-MM-DD (local time, no timezone shift). */
function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parses a YYYY-MM-DD string back into a local Date (avoids UTC shift). */
function fromDateKey(key: string): Date | undefined {
  if (!key) return undefined;
  const [yyyy, mm, dd] = key.split("-").map(Number);
  if (!yyyy || !mm || !dd) return undefined;
  return new Date(yyyy, mm - 1, dd);
}

/** Formats YYYY-MM-DD as a friendly display string, e.g. "10 Aug 2026". */
function formatDisplayDate(key: string): string {
  const date = fromDateKey(key);
  if (!date) return "Pick a date";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Returns today + 7 days, formatted as YYYY-MM-DD. */
function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDateKey(d);
}

export function SubmitToApproverDialog({
  open,
  onOpenChange,
  onConfirm,
  submittedBy = "",
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the selected approver name and the (editable) due date. */
  onConfirm: (submittedTo: string, dueDate: string) => void;
  /** The logged-in user's name (the "submitted by"), used to block self-approval. */
  submittedBy?: string;
  isSubmitting?: boolean;
}) {
  const [approvers, setApprovers] = useState<string[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState("");
  const [manualName, setManualName] = useState("");
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected("");
    setManualName("");
    setError("");
    // Auto-fill the due date to one week from today; user can still edit it.
    setDueDate(getDefaultDueDate());
    setLoadingApprovers(true);
    setLoadError(false);
    fetchApprovers()
      .then((names) => {
        // Never let the submitter pick themselves.
        const filtered = names.filter(
          (n) => n.trim().toLowerCase() !== submittedBy.trim().toLowerCase(),
        );
        setApprovers(filtered);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoadingApprovers(false));
  }, [open, submittedBy]);

  const usingDropdown = !loadError && (loadingApprovers || approvers.length > 0);

  const handleConfirm = () => {
    const trimmed = (usingDropdown ? selected : manualName).trim();
    if (!trimmed) {
      setError(
        usingDropdown
          ? "Please select an approver."
          : "Please enter the approver's name.",
      );
      return;
    }
    if (
      submittedBy &&
      trimmed.toLowerCase() === submittedBy.trim().toLowerCase()
    ) {
      setError("You can't submit a case to yourself for approval.");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      return;
    }
    onConfirm(trimmed, dueDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" /> Submit for Approval
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose who this case should be{" "}
            <span className="font-medium text-foreground">submitted to</span>{" "}
            for approval. Only that person (or an Admin) will be able to
            review, approve, or reject it.
          </p>
          <div className="space-y-1.5">
            <Label>Submitted To</Label>

            {usingDropdown ? (
              <Select
                value={selected}
                onValueChange={(v) => {
                  setSelected(v);
                  if (error) setError("");
                }}
                disabled={loadingApprovers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingApprovers
                        ? "Loading approvers…"
                        : "Select an approver"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {approvers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="e.g. Priya Sharma"
                value={manualName}
                onChange={(e) => {
                  setManualName(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) handleConfirm();
                }}
                autoFocus
              />
            )}

            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : loadError ? (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Couldn't load the approver
                list — enter a name manually.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Approvers are drawn from people already active in the system.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="submit-due-date" className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 shrink-0 text-blue-600" />
              <span>Due Date</span>
            </Label>

            <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="submit-due-date"
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-normal"
                >
                  <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {formatDisplayDate(dueDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDateKey(dueDate)}
                  onSelect={(date) => {
                    if (!date) return;
                    setDueDate(toDateKey(date));
                    if (error) setError("");
                    setDueDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <p className="text-xs text-muted-foreground">
              Defaults to one week from today — feel free to adjust it.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isSubmitting || loadingApprovers}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}