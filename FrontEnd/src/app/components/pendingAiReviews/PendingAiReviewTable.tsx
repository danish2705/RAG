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
import { Loader2, PlayCircle } from "lucide-react";
import type { LlmRetryEntry, LlmRetryStage } from "../../services/llmRetryApi";
import { formatTimestamp } from "../../utils/timezone";

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

function truncate(text: string, max = 90): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function PendingAiReviewsTable({
  entries,
  updatingId,
  onToggleStatus,
  resumingId,
  onResume,
}: {
  entries: LlmRetryEntry[];
  updatingId: number | null;
  onToggleStatus: (entry: LlmRetryEntry) => void;
  resumingId: number | null;
  onResume: (entry: LlmRetryEntry) => void;
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Pipeline</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Query</TableHead>
            <TableHead>Saved At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Resume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono font-medium tracking-wider">
                {entry.reference_code}
              </TableCell>
              <TableCell>{entry.full_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{entry.entity_type}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {STAGE_LABELS[entry.pipeline_stage] ?? entry.pipeline_stage}
              </TableCell>
              <TableCell
                className="max-w-xs text-sm text-muted-foreground"
                title={entry.query_text}
              >
                {truncate(entry.query_text)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatTimestamp(entry.created_at)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={entry.status === "pending" ? "secondary" : "outline"}
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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resumingId === entry.id}
                  onClick={() => onResume(entry)}
                  className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  {resumingId === entry.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <PlayCircle className="h-3.5 w-3.5" />
                      Resume
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
