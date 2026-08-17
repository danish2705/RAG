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

export interface DiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Discard AI Classification" */
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
 * Plain confirmation dialog shared by the Discard actions on the AI
 * Recommendation, Impact Assessment, Root Cause, and CAPA pages. No reason
 * is collected — discarding simply clears the data, so we just confirm.
 */
export function DiscardDialog({
  open,
  onOpenChange,
  title,
  subjectLabel,
  onCancel,
  onConfirm,
}: DiscardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Are you sure you want to discard {subjectLabel}? This will clear
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