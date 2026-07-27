import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Bot, Trash2, Pencil, PlusCircle, Settings2 } from "lucide-react";
import type { AuditLogEntry } from "../../types/audit";
import { formatTimestamp } from "../../utils/timezone";
import { truncateWords } from "../../utils/queryPreview";

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join(", ") || "—";
  if (typeof val === "object") {
    // Common shape: { severity, rationale } or { level, rationale } etc.
    const obj = val as Record<string, unknown>;
    const parts = Object.entries(obj)
      .filter(([k]) => k !== "confidence_score")
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
    return parts.join("; ") || "—";
  }
  return String(val);
}

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function actionMeta(entry: AuditLogEntry): {
  icon: React.ReactNode;
  label: string;
  badgeClass: string;
  rowClass: string;
} {
  switch (entry.action) {
    case "deleted":
      return {
        icon: <Trash2 className="h-4 w-4 text-red-600" />,
        label: "Deleted",
        badgeClass:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        rowClass: "",
      };
    case "field_edited":
      return {
        icon: <Pencil className="h-4 w-4 text-amber-600" />,
        label: "Edited",
        badgeClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        rowClass: "",
      };
    case "created":
      return {
        icon: <PlusCircle className="h-4 w-4 text-green-600" />,
        label: "Created",
        badgeClass:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        rowClass: "",
      };
    case "status_changed":
      return {
        icon: <Settings2 className="h-4 w-4 text-purple-600" />,
        label: "Status Changed",
        badgeClass:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        rowClass: "",
      };
    default:
      return {
        icon: <Bot className="h-4 w-4 text-blue-600" />,
        label: "AI Suggestion",
        badgeClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        rowClass: "",
      };
  }
}

function describeEntry(entry: AuditLogEntry): string {
  if (entry.action === "deleted") {
    const snap = entry.record_snapshot as Record<string, unknown> | null;
    const label = snap?.query
      ? truncate(String(snap.query), 60)
      : `record ${entry.entity_id}`;
    return `Deleted ${entry.entity_type} — ${label}${entry.reason ? ` (${entry.reason})` : ""}`;
  }
  if (entry.action === "field_edited") {
    return `${entry.field_name ?? "Field"}: "${truncate(renderValue(entry.old_value), 40)}" → "${truncate(renderValue(entry.new_value), 40)}"`;
  }
  if (entry.action === "created") {
    return entry.reason ?? `${entry.entity_type} record created`;
  }
  return entry.reason ?? entry.field_name ?? "—";
}

export function ActivityLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <TooltipProvider delayDuration={150}>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-26 font-semibold">Audit ID</TableHead>
                <TableHead className="w-34 font-semibold">User</TableHead>
                <TableHead className="w-60 font-semibold text-center">Details</TableHead>
                <TableHead className="w-25 font-semibold text-center">Source</TableHead>
                <TableHead className="w-32 font-semibold text-center">Action</TableHead>
                <TableHead className="w-50 font-semibold text-center">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white dark:bg-background">
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground text-sm"
                  >
                    No audit activity found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const meta = actionMeta(entry);
                  return (
                    <TableRow key={entry.id} className={meta.rowClass}>
                      <TableCell className="text-xs font-medium truncate">
                        {entry.entity_id
                          ? `#${entry.entity_id.slice(0, 8)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center min-w-0">
                          <span className="text-xs font-medium truncate">
                            {entry.performed_by}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-64 text-xs text-gray-900 dark:text-white overflow-hidden">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block break-words">
                              {truncateWords(describeEntry(entry), 12)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-sm whitespace-pre-wrap text-xs"
                          >
                            {describeEntry(entry)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            entry.source === "ai"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : entry.source === "system"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }
                        >
                          {entry.source === "ai"
                            ? "AI"
                            : entry.source === "system"
                              ? "System"
                              : "Human"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs gap-1 ${meta.badgeClass}`}
                        >
                          {meta.icon}
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-900 dark:text-white whitespace-nowrap text-center">
                        {formatTimestamp(entry.created_at, {
                          dateStyle: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>
    </div>
  );
}