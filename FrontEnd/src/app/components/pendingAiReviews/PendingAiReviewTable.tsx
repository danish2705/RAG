import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <TooltipProvider delayDuration={150}>
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                <TableHead className="w-30 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </TableHead>
                <TableHead className="w-110 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Query
                </TableHead>
                <TableHead className="w-70 py-3 px-14 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Stage
                </TableHead>
                <TableHead className="w-50 py-3 px-12 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </TableHead>
                <TableHead className="w-30 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-background">
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="py-3 px-4 text-xs font-medium truncate text-foreground">
                    {toTitleCase(entry.full_name)}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs text-gray-900 dark:text-white truncate">
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
                  <TableCell className="text-xs px-14">
                    {STAGE_LABELS[entry.pipeline_stage] ?? entry.pipeline_stage}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap">
                    {formatTimestamp(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        disabled={resumingId === entry.id}
                        onClick={() => onResume(entry)}
                        aria-label="Resume"
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {resumingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}