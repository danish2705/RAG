import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Override AI Classification" */
  title: string;
  /** e.g. "the AI classification" — used to build the description + placeholder text. */
  subjectLabel: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Justification dialog shared by the Override actions on the AI
 * Recommendation, Impact Assessment, Root Cause, and CAPA pages.
 */
export function OverrideDialog({
  open,
  onOpenChange,
  title,
  subjectLabel,
  value,
  onChange,
  onCancel,
  onConfirm,
  isLoading = false,
}: OverrideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Please provide a justification for overriding {subjectLabel}.
            This will be recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="overrideJustification">Justification *</Label>
            <Textarea
              id="overrideJustification"
              placeholder={`Explain why you are overriding ${subjectLabel}...`}
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!value.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              "Confirm Override"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}