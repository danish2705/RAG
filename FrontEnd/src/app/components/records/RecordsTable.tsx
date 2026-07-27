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
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { formatTimestamp } from "../../utils/timezone";
import { getQueryPreview, extractDescription } from "../../utils/queryPreview";

interface RecordsTableProps {
  loading: boolean;
  error: string | null;
  cases: any[];
  filteredCases: any[];
  onSort?: (field: string) => void;
  onSelectCase: (record: any) => void;
  onDeleteCase?: (record: any) => void;
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
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-32 text-sm font-semibold text-gray-900 dark:text-white">
                Records ID
              </TableHead>
              <TableHead className="w-44 text-sm font-semibold text-gray-900 dark:text-white">
                <button
                  onClick={() => onSort?.("submittedBy")}
                  className="flex items-center gap-1 hover:opacity-80 transition-colors text-sm"
                >
                  Submitted By{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="font-semibold w-[220px] text-center">Query</TableHead>
              <TableHead className="w-44 font-semibold">
                <button
                  onClick={() => onSort?.("classification")}
                  className="flex items-center gap-1 hover:opacity-80 transition-colors text-sm"
                >
                  Classification{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              {/* 1. Renamed Column: Saved Date & Time */}
              <TableHead className="w-52 text-sm font-semibold text-gray-900 dark:text-white text-center">
                <button
                  onClick={() => onSort?.("savedOn")}
                  className="flex items-center justify-center gap-1 hover:opacity-80 transition-colors w-full text-sm"
                >
                  Saved Date & Time{" "}
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TableHead>
              {/* Approval status */}
              <TableHead className="w-32 text-center font-semibold">
                Status
              </TableHead>
              {/* 2. Renamed Column: Actions */}
              <TableHead className="w-28 text-center text-sm font-semibold text-gray-900 dark:text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
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
                  <TableCell className="text-xs font-medium truncate">
                    {record.uiId || `#${record.id?.slice(0, 8)}`}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {toTitleCase(record.submittedBy || record.user || "") || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-900 dark:text-white overflow-hidden">
                    {record.query || record.description ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
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
                  <TableCell>
                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-medium shadow-none ${getBadgeColor(record.classification)}`}
                    >
                      {record.classification || "N/A"}
                    </Badge>
                  </TableCell>
                  {/* Formatted timestamp, auto-detected to the viewer's own timezone, dd-mm-yyyy */}
                  <TableCell className="text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {formatTimestamp(record.savedOn || record.timestamp, {
                      dateStyle: "numeric",
                    })}
                  </TableCell>

                  {/* Approval status badge */}
                  <TableCell className="text-center">
                    {record.approvalStatus === "approved" ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs px-2.5 py-0.5 font-medium shadow-none">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs px-2.5 py-0.5 font-medium shadow-none">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions Column: View only (delete icon removed) */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {/* View Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSelectCase(record)}
                        className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 transition-colors"
                        aria-label="View record details"
                      >
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};
