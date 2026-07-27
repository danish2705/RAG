import { SearchCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { SimilarQueryMatch } from "../services/recordsApi";

function getBadgeColor(type: string) {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
}

export interface SimilarQueryDialogControl {
  isOpen: boolean;
  matches: SimilarQueryMatch[];
  onExplore: (match: SimilarQueryMatch) => void;
  onSkip: () => void;
  onOpenChange: (open: boolean) => void;
}

export function SimilarQueryDialog({
  control,
}: {
  control: SimilarQueryDialogControl;
}) {
  const { isOpen, matches, onExplore, onSkip, onOpenChange } = control;
  const topMatch = matches[0];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <SearchCheck className="h-5 w-5" />
            <DialogTitle>Similar query already submitted</DialogTitle>
          </div>
          <DialogDescription>
            We found {matches.length === 1 ? "a" : matches.length} similar case
            {matches.length === 1 ? "" : "s"} already logged. Take a look before
            submitting a new one, or continue if this is a separate event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matches.map((match) => (
            <div
              key={`${match.case_type}-${match.id}`}
              className="rounded-lg border border-border bg-muted/40 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge
                  className={`text-xs px-2 py-0.5 font-medium shadow-none ${getBadgeColor(
                    match.case_type,
                  )}`}
                >
                  {match.case_type}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(match.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">
                {match.description}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onSkip}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700"
          >
            Skip &amp; Continue
          </Button>
          <Button
            onClick={() => topMatch && onExplore(topMatch)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          >
            Explore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
