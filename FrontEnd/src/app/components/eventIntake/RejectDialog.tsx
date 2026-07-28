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

export interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Reject AI Classification" */
  title: string;
  /** Unused now that the dialog is a plain confirmation — kept so existing callers don't need to change. */
  description?: ReactNode;
  /** e.g. "the AI classification" — used to build the confirmation copy. */
  subjectLabel: string;
  value?: string;
  onChange?: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Plain confirmation dialog shared by the Reject actions on the AI
 * Recommendation, Impact Assessment, Root Cause, and CAPA pages. No reason
 * is collected — rejecting simply clears the data, so we just confirm.
 */
export function RejectDialog({
  open,
  onOpenChange,
  title,
  subjectLabel,
  onCancel,
  onConfirm,
}: RejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject {subjectLabel}? This will clear
            the data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}