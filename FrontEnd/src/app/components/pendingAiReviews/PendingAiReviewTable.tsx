import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Loader2, PlayCircle, Trash2 } from "lucide-react";
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

export function PendingAiReviewsTable({
  entries,
  updatingId,
  onToggleStatus,
  resumingId,
  onResume,
  deletingId,
  onDelete,
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
    <div className="rounded-xl border overflow-x-auto">
      <TooltipProvider delayDuration={150}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 dark:bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Saved At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.full_name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      entry.entity_type === "Deviation"
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                    }
                  >
                    {entry.entity_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {STAGE_LABELS[entry.pipeline_stage] ?? entry.pipeline_stage}
                </TableCell>
                <TableCell className="max-w-[220px] text-sm text-muted-foreground truncate">
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
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(entry.created_at)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={
                      entry.status === "pending" ? "secondary" : "outline"
                    }
                    disabled={updatingId === entry.id}
                    onClick={() => onToggleStatus(entry)}
                    className={
                      entry.status === "pending"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border-transparent"
                    }
                  >
                    {updatingId === entry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : entry.status === "pending" ? (
                      "Pending"
                    ) : (
                      "Not Executed"
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Resume
                      </TooltipContent>
                    </Tooltip>

                    {onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            disabled={deletingId === entry.id}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this pending AI review entry? This cannot be undone.",
                                )
                              ) {
                                onDelete(entry);
                              }
                            }}
                            aria-label="Delete"
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          Delete
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}