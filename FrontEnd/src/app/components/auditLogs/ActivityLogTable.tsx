import React, { useState } from "react";
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
  Bot,
  Trash2,
  Pencil,
  PlusCircle,
  Settings2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import type { AuditLogEntry } from "../../types/audit";
import { formatTimestamp } from "../../utils/timezone";
import { truncateWords } from "../../utils/queryPreview";

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join(", ") || "—";
  if (typeof val === "object") {
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

// Upgraded to accept an isFull flag so accordion views never get truncated
function describeEntry(entry: AuditLogEntry, isFull = false): string {
  if (entry.action === "deleted") {
    const snap = entry.record_snapshot as Record<string, unknown> | null;
    const label = snap?.query
      ? (isFull ? String(snap.query) : truncate(String(snap.query), 60))
      : `record ${entry.entity_id}`;
    return `Deleted ${entry.entity_type} — ${label}${entry.reason ? ` (${entry.reason})` : ""}`;
  }
  if (entry.action === "field_edited") {
    const oldVal = renderValue(entry.old_value);
    const newVal = renderValue(entry.new_value);
    // When viewing full accordion details, display the entire strings on clean labeled lines
    if (isFull) {
      return `${entry.field_name ?? "Field"}:\n\n[Old Value]:\n"${oldVal}"\n\n[New Value]:\n"${newVal}"`;
    }
    return `${entry.field_name ?? "Field"}: "${truncate(oldVal, 40)}" → "${truncate(newVal, 40)}"`;
  }
  if (entry.action === "created") {
    return entry.reason ?? `${entry.entity_type} record created`;
  }
  return entry.reason ?? entry.field_name ?? "—";
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

// Formats embedded JSON strings cleanly without changing typography styles
function formatLogText(text: string): string {
  try {
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return JSON.stringify(JSON.parse(text), null, 2);
    }
    const jsonMatch = text.match(/(\{.*\}|\[.*\])/s);
    if (jsonMatch && jsonMatch[0]) {
      const prefix = text.slice(0, jsonMatch.index).trim();
      const suffix = text.slice((jsonMatch.index || 0) + jsonMatch[0].length).trim();
      const parsedJson = JSON.stringify(JSON.parse(jsonMatch[0]), null, 2);
      return `${prefix}\n\n${parsedJson}${suffix ? `\n\n${suffix}` : ""}`;
    }
  } catch {
    // Fallback to normal text if JSON parsing fails
  }
  return text;
}

export function ActivityLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const toggleExpand = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string | number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
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
              entries.map((entry, index) => {
                const meta = actionMeta(entry);
                const rowId = entry.id ?? entry.entity_id ?? `row-${index}`;
                
                // Generate both concise preview text and complete untruncated details
                const previewText = describeEntry(entry, false);
                const fullDetailsText = describeEntry(entry, true);
                const formattedDetails = formatLogText(fullDetailsText);
                const isExpanded = expandedIds.has(rowId);

                // Only show expand chevron if the full description is actually long
                const isLongText = fullDetailsText.length > 55;

                return (
                  <React.Fragment key={rowId}>
                    {/* MAIN TABLE ROW */}
                    <TableRow
                      onClick={() => isLongText && toggleExpand(rowId)}
                      className={`transition-colors ${meta.rowClass} ${
                        isLongText ? "cursor-pointer hover:bg-muted/40" : ""
                      } ${isExpanded ? "bg-muted/30 dark:bg-muted/10 border-b-0" : ""}`}
                    >
                      <TableCell className="text-xs font-medium truncate">
                        {entry.entity_id
                          ? `#${entry.entity_id.slice(0, 8)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center min-w-0">
                          <span className="text-xs font-medium truncate">
                            {toTitleCase(entry.performed_by)}
                          </span>
                        </div>
                      </TableCell>

                      {/* DETAILS CELL */}
                      <TableCell className="w-64 text-xs text-gray-900 dark:text-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`block break-words ${!isExpanded ? "line-clamp-1" : "text-muted-foreground font-medium"}`}>
                            {isExpanded ? "Expanded log view:" : truncateWords(previewText, 12)}
                          </span>
                          {isLongText && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(rowId);
                              }}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors focus:outline-none"
                              title={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
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

                    {/* EXPANDED ACCORDION SUB-ROW (Restricted strictly to the Details column width) */}
                    {isExpanded && (
                      <TableRow className="bg-muted/10 dark:bg-muted/5 hover:bg-muted/10 border-t-0">
                        <TableCell className="py-0" />
                        <TableCell className="py-0" />
                        
                        <TableCell colSpan={1} className="py-2 px-3 animate-in fade-in duration-150">
                          <div className="rounded-md border border-border bg-card p-3 shadow-sm text-foreground">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <span>Full Description</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(e, fullDetailsText, rowId)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                              >
                                {copiedId === rowId ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                    <span className="text-green-600 dark:text-green-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <div className="text-xs font-sans leading-relaxed max-h-60 overflow-y-auto pr-1 select-text whitespace-pre-wrap break-words text-gray-900 dark:text-white">
                              {formattedDetails}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-0" />
                        <TableCell className="py-0" />
                        <TableCell className="py-0" />
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}