import React from "react";
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
  Eye,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { formatTimestamp } from "../../utils/timezone";
import { getQueryPreview, extractDescription } from "../../utils/queryPreview";
import { ApprovalStatusBadge } from "../approvals/ApprovalEditModal";

interface RecordsTableProps {
  loading: boolean;
  error: string | null;
  cases: any[];
  filteredCases: any[];
  onSort?: (field: string) => void;
  onSelectCase: (record: any) => void;
  onDeleteCase?: (record: any) => void;
  /** True when the current user may resubmit this (rejected) record. */
  canResubmit?: (record: any) => boolean;
  onResubmit?: (record: any) => void;
}

function toTitleCase(value: string): string {
  if (!value) return "—";

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

export const RecordsTable: React.FC<RecordsTableProps> = ({
  loading,
  error,
  cases,
  filteredCases,
  onSort,
  onSelectCase,
  onDeleteCase,
  canResubmit,
  onResubmit,
}) => {
  const getBadgeColor = (type: string) => {
    if (type === "Deviation")
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    if (type === "Change Control")
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading case records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm font-semibold">Failed to load records</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
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
              {/* Added explicit header font styling: text-[11px] font-semibold text-muted-foreground uppercase tracking-wider across all columns */}
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-32 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Record ID
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-44 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => onSort?.("submittedBy")}
                  className="flex items-center gap-1 hover:opacity-80 transition-colors text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Submitted By{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-[400px] py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Query
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-44 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => onSort?.("classification")}
                  className="flex items-center gap-1 hover:opacity-80 transition-colors text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Classification{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              {/* Saved Date & Time */}
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-52 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                <button
                  onClick={() => onSort?.("savedOn")}
                  className="flex items-center justify-center gap-1 hover:opacity-80 transition-colors w-full text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Saved Date & Time{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              {/* Approval status */}
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-32 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Status
              </TableHead>
              {/* Actions */}
              <TableHead className="sticky top-0 z-10 bg-slate-50 dark:bg-neutral-900 w-28 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  {cases.length === 0
                    ? "No records found yet. Create your first case to get started."
                    : "No records found matching your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((record, idx) => (
                <TableRow
                  key={record.uiId || record.id || idx}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="py-3 px-4 text-xs font-medium truncate">
                    {record.uiId || `#${record.id?.slice(0, 8)}`}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-medium text-xs text-foreground">
                    {toTitleCase(record.submittedBy || record.user || "") || "N/A"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-xs text-gray-900 dark:text-white overflow-hidden max-w-[220px]">
                    {record.query || record.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default block truncate">
                            {getQueryPreview(
                              record.query || record.description,
                              12,
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-sm whitespace-pre-wrap text-xs"
                        >
                          {extractDescription(
                            record.query || record.description,
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-medium shadow-none ${getBadgeColor(record.classification)}`}
                    >
                      {record.classification || "N/A"}
                    </Badge>
                  </TableCell>
                  {/* Formatted timestamp with monospace font */}
                  <TableCell className="py-3 px-4 text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {formatTimestamp(record.savedOn || record.timestamp, {
                      dateStyle: "numeric",
                    })}
                  </TableCell>

                  {/* Approval status badge — full lifecycle: Submitted (pending)
                      -> In Review -> Approved, or Rejected (with reason on hover). */}
                  <TableCell className="py-3 px-4 text-center">
                    {record.approvalStatus === "rejected" &&
                    record.rejectionReason ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block cursor-default">
                            <ApprovalStatusBadge status="rejected" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs whitespace-pre-wrap text-xs"
                        >
                          {record.rejectedBy ? `${record.rejectedBy}: ` : ""}
                          {record.rejectionReason}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <ApprovalStatusBadge
                        status={record.approvalStatus || "pending"}
                      />
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectCase(record)}
                        className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors"
                        aria-label="View record details"
                      >
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      {canResubmit?.(record) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onResubmit?.(record)}
                              className="h-8 w-8 rounded-full hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50 dark:hover:text-amber-400 transition-colors"
                              aria-label="Edit and resubmit for approval"
                            >
                              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Edit &amp; resubmit for approval
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};