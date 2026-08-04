import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Loader2, PlayCircle } from "lucide-react";
import type { LlmRetryEntry, LlmRetryStage } from "../../services/llmRetryApi";
import { formatTimestamp } from "../../utils/timezone";
import { getQueryPreview, extractDescription } from "../../utils/queryPreview";

const STAGE_LABELS: Record<LlmRetryStage, string> = {
  classification: "Classification",
  impact_assessment: "Impact Assessment",
  rca: "Root Cause Analysis",
  capa: "CAPA",
  change_impact_assessment: "Change Impact Assessment",
  risk_criticality: "Risk & Criticality",
  validation_testing: "Validation & Testing",
  implementation_control: "Implementation & Control",
  final_summary: "Final Summary",
};

export function toTitleCase(value: string): string {
  if (!value) return "";

  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

export function PendingAiReviewsTable({
  entries,
  resumingId,
  onResume,
}: {
  entries: LlmRetryEntry[];
  updatingId: number | null;
  onToggleStatus: (entry: LlmRetryEntry) => void;
  resumingId: number | null;
  onResume: (entry: LlmRetryEntry) => void;
  deletingId?: number | null;
  onDelete?: (entry: LlmRetryEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border border-dashed rounded-xl">
        No saved AI submissions found. When the AI service is unavailable while
        someone submits a query, it will show up here.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex h-full flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow>
                <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-40 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-[400px] py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Query
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-48 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Stage
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-52 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Timestamp
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-28 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60 bg-white dark:bg-background">
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="py-3 px-4 font-medium text-xs text-foreground truncate">
                    {toTitleCase(entry.full_name)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-xs text-gray-900 dark:text-white max-w-[220px] truncate">
                    {entry.query_text ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {getQueryPreview(entry.query_text, 12)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-sm whitespace-pre-wrap text-xs"
                        >
                          {extractDescription(entry.query_text)}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-xs text-foreground">
                    {STAGE_LABELS[entry.pipeline_stage] ?? entry.pipeline_stage}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {formatTimestamp(entry.created_at)}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={resumingId === entry.id}
                            onClick={() => onResume(entry)}
                            aria-label="Resume"
                            className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                          >
                            {resumingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Resume
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}