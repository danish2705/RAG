import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertTriangle, Trash2, User, Loader2 } from "lucide-react";

interface DeleteRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any | null;
  onConfirmDelete: (recordId: string, deletedBy: string) => Promise<void> | void;
}

export const DeleteRecordModal: React.FC<DeleteRecordModalProps> = ({
  open,
  onOpenChange,
  record,
  onConfirmDelete,
}) => {
  const [step, setStep] = useState<"confirm" | "prompt">("confirm");
  const [userName, setUserName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  // Reset state whenever modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("confirm");
      setUserName("");
      setError("");
      setIsDeleting(false);
    }
  }, [open]);

  if (!record) return null;

  const recordId = record.uiId || record.id || "this record";

  const handleDeleteSubmit = async () => {
    if (!userName.trim()) {
      setError("Please enter your name to confirm deletion.");
      return;
    }
    setError("");
    setIsDeleting(true);
    try {
      await onConfirmDelete(record.id || record.uiId, userName.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-red-200 dark:border-red-900/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {step === "confirm" ? "Confirm Deletion" : "Authorization Required"}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {step === "confirm"
              ? `Are you sure you want to permanently delete record ${recordId}? This action cannot be undone.`
              : `To authorize permanent deletion of ${recordId}, please enter your full name below for the audit trail.`}
          </DialogDescription>
        </DialogHeader>

        {step === "prompt" && (
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="delete-user-name" className="flex items-center gap-1.5 text-xs font-semibold">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Your Full Name
              </Label>
              <Input
                id="delete-user-name"
                placeholder="e.g. Anurag Sharma"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userName.trim()) handleDeleteSubmit();
                }}
                autoFocus
                className="border-red-300 focus-visible:ring-red-500 dark:border-red-800"
              />
              {error && <p className="text-xs text-red-600 font-medium pt-1">{error}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          {step === "confirm" ? (
            <Button
              variant="destructive"
              onClick={() => setStep("prompt")}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Yes, Delete Record
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={isDeleting || !userName.trim()}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Confirm & Delete
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};