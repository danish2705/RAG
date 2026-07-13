import type { ReactNode } from "react";
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

export interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Reject AI Classification" */
  title: string;
  /** Full dialog description text/copy — wording varies slightly per page. */
  description: ReactNode;
  /** e.g. "the AI classification" — used to build the placeholder text. */
  subjectLabel: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Justification dialog shared by the Reject actions on the AI
 * Recommendation, Impact Assessment, Root Cause, and CAPA pages.
 */
export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  subjectLabel,
  value,
  onChange,
  onCancel,
  onConfirm,
}: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejectJustification">Reason for Rejection *</Label>
            <Textarea
              id="rejectJustification"
              placeholder={`Explain why you are rejecting ${subjectLabel}...`}
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
          <Button
            onClick={onConfirm}
            disabled={!value.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}