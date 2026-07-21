import { WifiOff, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { LlmFailureRecoveryControl } from "../hooks/shared/useLlmFailureRecovery";

export function LlmFailureDialog({
  control,
}: {
  control: LlmFailureRecoveryControl;
}) {
  const {
    isOpen,
    closeLlmFailureDialog,
    name,
    setName,
    nameError,
    isSaving,
    saveError,
    isSaved,
    submitLlmFailure,
  } = control;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && closeLlmFailureDialog()}
    >
      <DialogContent className="sm:max-w-md">
        {isSaved ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <DialogTitle>Saved for later</DialogTitle>
              </div>
              <DialogDescription>
                Your entry is safe. Come back to it anytime from{" "}
                <span className="font-medium text-foreground">
                  Pending AI Reviews
                </span>{" "}
                once the AI service is back up.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={closeLlmFailureDialog}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <WifiOff className="h-5 w-5" />
                <DialogTitle>AI service is unavailable</DialogTitle>
              </div>
              <DialogDescription>
                We couldn&apos;t reach the AI right now. You can save this entry
                and come back to try it again later — nothing will be lost.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="llm-failure-name">Your name</Label>
              <Input
                id="llm-failure-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                aria-invalid={!!nameError}
                disabled={isSaving}
              />
              {nameError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {nameError}
                </p>
              )}
              {saveError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {saveError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeLlmFailureDialog}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={submitLlmFailure} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save & try later"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
