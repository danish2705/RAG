import React from "react";

export function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
        None
      </span>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((point, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// Turns e.g. "gxp_classification" into "GXP Classification" for clean plain-text reports.
function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b(gxp|uat|sop|rca|capa|id|qa|wi|ist)\b/gi, (match) => match.toUpperCase())
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Helper to safely format any timestamp or ISO string into local IST
function safeFormatDate(val: unknown): string {
  if (!val) return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  try {
    const str = String(val);
    if (str.includes("IST") || str.includes("AM") || str.includes("PM")) return str;
    const date = new Date(str);
    if (isNaN(date.getTime())) return str;
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  } catch {
    return String(val);
  }
}

// Recursively renders any value (string, boolean, array, nested object)
// into indented plain-text lines without truncating or missing nested data.
function renderValueLines(value: unknown, indent: string): string[] {
  if (value === null || value === undefined || value === "") {
    return [`${indent}—`];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${indent}—`];
    return value.flatMap((item) =>
      typeof item === "object" && item !== null
        ? renderValueLines(item, indent + "  ")
        : [`${indent}- ${String(item)}`]
    );
  }

  if (typeof value === "object") {
    const lines: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "confidence_score") continue; // surfaced separately per section
      if (v === null || v === undefined || v === "") continue;

      const label = humanizeKey(k);
      if (typeof v === "object") {
        if (Array.isArray(v) && v.length === 0) continue;
        if (!Array.isArray(v) && Object.keys(v as object).length === 0) continue;
        lines.push(`${indent}${label}:`);
        lines.push(...renderValueLines(v, indent + "  "));
      } else {
        lines.push(`${indent}${label}: ${String(v)}`);
      }
    }
    return lines.length ? lines : [`${indent}—`];
  }

  return [`${indent}${String(value)}`];
}

function renderSection(title: string, data: unknown): string[] {
  if (data === null || data === undefined || data === "") return [];
  if (Array.isArray(data) && data.length === 0) return [];
  if (typeof data === "object" && Object.keys(data as object).length === 0) return [];

  const lines = [`--- ${title.toUpperCase()} ---`];
  const confidence = (data as Record<string, unknown>)?.confidence_score;
  if (typeof confidence === "number") {
    lines.push(`Confidence Score: ${confidence}%`);
  }
  lines.push(...renderValueLines(data, ""));
  lines.push("");
  return lines;
}

// Builds an exhaustive plain-text report covering EVERY pipeline stage present
// on the record regardless of case type differences or naming discrepancies.
export function buildFullSummaryText(record: any): string {
  if (!record) return "No record data available.";

  // Detect Case Type safely from multiple potential properties
  const rawType =
    record.case_type ??
    (typeof record.classification === "string"
      ? record.classification
      : record.classification?.classification) ??
    record.type ??
    "Quality Event";

  const recordId = record.id ?? record.uiId ?? "N/A";
  const submittedBy = record.saved_by ?? record.submittedBy ?? record.user ?? "N/A";
  const timestamp = safeFormatDate(record.created_at ?? record.savedOn ?? record.timestamp ?? record.updatedOn);
  const status = record.status ?? "Verified & Archived";
  const description = record.query || record.description || "No description provided.";

  const lines: string[] = [
    "====================================================",
    "           QUALITY MANAGEMENT SYSTEM REPORT          ",
    "====================================================",
    `Record ID:       ${recordId}`,
    `Case Type:       ${rawType}`,
    `Submitted By:    ${submittedBy}`,
    `Status:          ${status}`,
    `Saved Timestamp: ${timestamp}`,
    "----------------------------------------------------",
    "EVENT QUERY / DESCRIPTION:",
    description,
    "----------------------------------------------------",
    "",
  ];

  // 1. Classification & Root Rationale
  if (typeof record.classification === "object" && record.classification !== null) {
    lines.push(...renderSection("Classification", record.classification));
  } else if (record.classification || record.rationale) {
    lines.push(...renderSection("Classification & Rationale", {
      classification: record.classification ?? rawType,
      rationale: record.rationale,
    }));
  }

  // 2. Immediate Actions (if any)
  if (record.immediateActions || record.immediate_actions) {
    lines.push(...renderSection("Immediate Actions", record.immediateActions ?? record.immediate_actions));
  }

  // 3. Deviation-Specific Sections
  if (record.impact_assessment) {
    lines.push(...renderSection("Impact Assessment", record.impact_assessment));
  }
  if (record.rca || record.root_cause_analysis) {
    lines.push(...renderSection("Root Cause Analysis", record.rca ?? record.root_cause_analysis));
  }
  if (record.capa) {
    lines.push(...renderSection("Corrective & Preventive Actions (CAPA)", record.capa));
  }

  // 4. Change Control-Specific Sections
  if (record.change_impact_assessment) {
    lines.push(...renderSection("Change Impact Assessment", record.change_impact_assessment));
  }
  if (record.risk_criticality || record.risk_evaluation) {
    lines.push(...renderSection("Risk & Criticality Evaluation", record.risk_criticality ?? record.risk_evaluation));
  }
  if (record.validation_testing || record.validation) {
    lines.push(...renderSection("Validation & Testing Strategy", record.validation_testing ?? record.validation));
  }
  if (record.implementation_control || record.implementation) {
    lines.push(...renderSection("Implementation & Control Actions", record.implementation_control ?? record.implementation));
  }

  // 5. Final Summary / Additional Comments (Now included for BOTH Deviation & Change Control)
  if (record.final_summary || record.summary) {
    lines.push(...renderSection("Final Summary", record.final_summary ?? record.summary));
  }

  // 6. Attachments / Evidence
  if (record.attachments || record.files) {
    lines.push(...renderSection("Attached Evidence / Files", record.attachments ?? record.files));
  }

  lines.push("====================================================");
  lines.push(`Report Downloaded: ${safeFormatDate(new Date())}`);
  lines.push("====================================================");

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}