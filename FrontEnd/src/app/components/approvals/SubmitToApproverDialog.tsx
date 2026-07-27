import { useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
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

function capitaliseFirstWord(value: string): string {
  return value.replace(
    /^(\s*)([a-z])/,
    (_m, lead, ch) => lead + ch.toUpperCase(),
  );
}

export function SubmitToApproverDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the validated, capitalised approver name. */
  onConfirm: (submittedTo: string) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleChange = (raw: string) => {
    setName(capitaliseFirstWord(raw));
    if (error) setError("");
  };

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter the approver's name.");
      return;
    }
    // First word must start with a capital letter.
    if (!/^[A-Z]/.test(trimmed)) {
      setError("The first letter of the name must be a capital letter.");
      return;
    }
    onConfirm(trimmed);
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
            Enter the name of the person this case should be{" "}
            <span className="font-medium text-foreground">submitted to</span>{" "}
            for approval. Only that person will be able to review and approve
            it.
          </p>
          <div className="space-y-1.5">
            <Label>Submitted To</Label>
            <Input
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) handleConfirm();
              }}
              autoFocus
            />
            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The first letter is capitalised automatically.
              </p>
            )}
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
            disabled={isSubmitting}
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
