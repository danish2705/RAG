import {
  Card,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertTriangle, ArrowUpDown, Database, Eye, Loader2 } from "lucide-react";
import type { AnyCase } from "../../types/Records";
import type { RecordsSortField } from "../../hooks/records/useRecords";
import { getAlternatingRowClass, getRowBorderClass, getClassificationBadgeClass } from "../../utils/records/badges";

export function RecordsTable({
  loading,
  error,
  cases,
  filteredCases,
  onSort,
  onSelectCase,
}: {
  loading: boolean;
  error: string | null;
  cases: AnyCase[];
  filteredCases: AnyCase[];
  onSort: (field: RecordsSortField) => void;
  onSelectCase: (record: AnyCase) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span className="text-muted-foreground text-sm">Loading records…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
            <p className="text-foreground font-medium">Could not load cases</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No records yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Saved cases will appear here.
            </p>
          </div>
        ) : (
          <Table className="border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                <TableHead className="w-20 font-semibold text-foreground">
                  UI ID
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <button
                    onClick={() => onSort("saved_by")}
                    className="flex items-center gap-2"
                  >
                    Submitted By
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">Query</TableHead>
                <TableHead className="font-semibold text-foreground">
                  <button
                    onClick={() => onSort("classification")}
                    className="flex items-center gap-2"
                  >
                    Classification
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <button
                    onClick={() => onSort("created_at")}
                    className="flex items-center gap-2"
                  >
                    Saved On
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="w-24 text-center font-semibold text-foreground">
                  View
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((c, index) => (
                <TableRow
                  key={`${c.case_type}-${c.id}`}
                  className={`transition-colors ${getAlternatingRowClass(index)}`}
                >
                  <TableCell
                    className={`font-mono text-sm text-muted-foreground ${getRowBorderClass(index)}`}
                  >
                    #{String(c.id).padStart(4, "0")}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {c.saved_by || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    <span className="line-clamp-2">{c.query}</span>
                  </TableCell>
                  <TableCell>
                    {c.classification ? (
                      <Badge
                        className={`text-xs ${getClassificationBadgeClass(c.classification.classification)}`}
                      >
                        {c.classification.classification}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => onSelectCase(c)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}