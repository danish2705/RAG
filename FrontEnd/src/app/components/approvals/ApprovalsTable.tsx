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
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
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
  /** True when the logged-in user is the approver for this row. */
  canApprove: (row: any) => boolean;
  /** Open the editable review modal for a row. */
  onReview: (row: any) => void;
}

export const ApprovalsTable: React.FC<ApprovalsTableProps> = ({
  loading,
  error,
  rows,
  canApprove,
  onReview,
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
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-32 font-semibold">Assigned ID</TableHead>
              <TableHead className="font-semibold w-[220px] pl-4">
                Query
              </TableHead>
              <TableHead className="w-40 font-semibold">Submitted By</TableHead>
              <TableHead className="w-40 font-semibold">Submitted To</TableHead>
              <TableHead className="w-52 font-semibold">
                Saved Date &amp; Time
              </TableHead>
              <TableHead className="w-44 text-center font-semibold">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No cases have been submitted to you for approval yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const isApproved = row.approvalStatus === "approved";
                const allowed = canApprove(row);
                return (
                  <TableRow
                    key={row.uiId || row.id || idx}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                      {row.uiId || `#${row.id?.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground w-[220px] truncate">
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
                    <TableCell className="font-medium text-sm text-foreground">
                      {row.submittedBy || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-sm text-foreground">
                      {row.submittedTo || "N/A"}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(row.savedOn, { dateStyle: "numeric" })}
                    </TableCell>

                    {/* Action: status badge + gated Review & Approve button */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isApproved ? (
                          <>
                            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs px-2.5 py-0.5 font-medium shadow-none">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onReview(row)}
                              className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors"
                              aria-label="View approved case"
                            >
                              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs px-2.5 py-0.5 font-medium shadow-none">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                            {allowed ? (
                              <Button
                                size="sm"
                                onClick={() => onReview(row)}
                                className="h-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium shadow-sm border-0 gap-1.5"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Review &amp; Approve
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground italic select-none">
                                    Awaiting approver
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="bottom"
                                  className="text-xs"
                                >
                                  Only {row.submittedTo} can approve this case.
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </div>
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
