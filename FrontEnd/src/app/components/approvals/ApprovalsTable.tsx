import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { ClipboardCheck, Loader2, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { formatTimestamp } from "../../utils/timezone";
import { getQueryPreview, extractDescription } from "../../utils/queryPreview";

interface ApprovalsTableProps {
  loading: boolean;
  error: string | null;
  rows: any[];
  /** True when the logged-in user is the assigned approver for this row. */
  canApprove: (row: any) => boolean;
  /** Open the review/approve modal for a row. */
  onReview: (row: any) => void;
}

export const ApprovalsTable: React.FC<ApprovalsTableProps> = ({
  loading,
  error,
  rows,
  canApprove,
  onReview,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading approvals…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm font-semibold">Failed to load approvals</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow>
              {/* Added standard header styling: text-[11px] font-semibold text-muted-foreground uppercase tracking-wider */}
              <TableHead className="w-32 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Approval ID</TableHead>
              <TableHead className="w-[220px] py-3 pl-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Query
              </TableHead>
              <TableHead className="w-40 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Submitted By</TableHead>
              <TableHead className="w-40 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Submitted To</TableHead>
              <TableHead className="w-52 py-3 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Timestamp</TableHead>
              <TableHead className="w-48 py-3 px-4 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60 bg-white dark:bg-background">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No pending cases for approval.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                return (
                  <TableRow
                    key={row.uiId || row.id || idx}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="py-3 px-4 font-mono text-xs font-semibold text-foreground">
                      {row.uiId || `#${row.id?.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="py-3 pl-4 text-xs text-gray-900 dark:text-white w-[220px] truncate">
                      {row.query ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default">
                              {getQueryPreview(row.query, 12)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-sm whitespace-pre-wrap text-xs"
                          >
                            {extractDescription(row.query)}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    {/* Changed text-sm to text-xs font-medium to match standard typography */}
                    <TableCell className="py-3 px-4 font-medium text-xs text-foreground">
                      {row.submittedBy || "N/A"}
                    </TableCell>
                    {/* Changed text-sm to text-xs font-medium to match standard typography */}
                    <TableCell className="py-3 px-4 font-medium text-xs text-foreground">
                      {row.submittedTo || "N/A"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap text-center">
                      {formatTimestamp(row.savedOn, { dateStyle: "numeric" })}
                    </TableCell>

                    {/* Action: enabled only for the assigned approver. */}
                    <TableCell className="py-3 px-4 text-center">
                      {canApprove(row) ? (
                        <Button
                          size="sm"
                          onClick={() => onReview(row)}
                          className="h-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium shadow-sm border-0 gap-1.5"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          Go for Approval
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* span wrapper so the tooltip works on a disabled button */}
                            <span className="inline-block">
                              <Button
                                size="sm"
                                disabled
                                className="h-8 bg-blue-600 text-white text-xs font-medium gap-1.5 border-0 disabled:opacity-40 cursor-not-allowed"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Go for Approval
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Only {row.submittedTo} can approve this case.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};