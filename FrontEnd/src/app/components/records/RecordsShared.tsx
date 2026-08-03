import React from "react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, BorderStyle } from "docx";
import { Download, FileText, FileType2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";
import { RISK_FIELD_LABELS } from "../../../constants/records";

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

// Helper to safely format timestamps into readable local IST
function safeFormatDate(val: unknown): string {
  if (!val)
    return (
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
    );
  try {
    const str = String(val);
    if (str.includes("IST") || str.includes("AM") || str.includes("PM"))
      return str;
    const date = new Date(str);
    if (isNaN(date.getTime())) return str;
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  } catch {
    return String(val);
  }
}

// Helper to format string arrays as clean bullet points for text reports
function formatBulletArray(items?: string[]): string[] {
  if (!items || !Array.isArray(items) || items.length === 0)
    return ["  — None"];
  return items.map((item) => `  * ${item}`);
}

// Builds an exhaustive, point-to-point plain text report matching 100% of UI card fields
export function buildFullSummaryText(record: any): string {
  if (!record || typeof record !== "object") return "No record data available.";

  const recordId = record.id ?? record.uiId ?? "N/A";
  const rawType =
    record.case_type ??
    (typeof record.classification === "string"
      ? record.classification
      : record.classification?.classification) ??
    record.type ??
    "Quality Event";
  const submittedBy =
    record.saved_by ?? record.submittedBy ?? record.user ?? "N/A";
  const timestamp = safeFormatDate(
    record.created_at ?? record.savedOn ?? record.timestamp ?? record.updatedOn,
  );
  const status = record.status ?? "Verified & Archived";
  const site = record.site ?? record.location ?? "N/A";
  const sourceSystem = record.sourceSystem ?? record.source_system ?? "N/A";
  const department = record.department ?? "N/A";
  const description =
    record.query || record.description || "No description provided.";

  const lines: string[] = [
    "====================================================",
    "           QUALITY MANAGEMENT SYSTEM REPORT          ",
    "====================================================",
    `Record ID:       ${recordId}`,
    `Case Type:       ${rawType}`,
    `Submitted By:    ${submittedBy}`,
    `Status:          ${status}`,
    `Saved Timestamp: ${timestamp}`,
    `Site / Location: ${site}`,
    `Source System:   ${sourceSystem}`,
    `Department:      ${department}`,
    "----------------------------------------------------",
    "EVENT QUERY / DESCRIPTION:",
    description,
    "----------------------------------------------------",
    "",
  ];

  // 1. CLASSIFICATION SECTION
  const cls = record.classification;
  if (cls && typeof cls === "object") {
    lines.push("--- CLASSIFICATION ---");
    if (cls.confidence_score !== undefined)
      lines.push(`AI Confidence Score: ${cls.confidence_score}%`);
    lines.push(`Type: ${cls.classification ?? rawType}`);
    lines.push("AI Rationale:");
    if (Array.isArray(cls.rationale)) {
      lines.push(...formatBulletArray(cls.rationale));
    } else {
      lines.push(`  ${cls.rationale || "—"}`);
    }
    lines.push("");
  } else if (record.classification || record.rationale) {
    lines.push("--- CLASSIFICATION & RATIONALE ---");
    lines.push(`Type: ${record.classification ?? rawType}`);
    lines.push(`Rationale: ${record.rationale || "—"}`);
    lines.push("");
  }

  // 2. IMMEDIATE ACTIONS & ATTACHMENTS
  if (record.immediateActions || record.immediate_actions) {
    lines.push("--- IMMEDIATE ACTIONS ---");
    lines.push(String(record.immediateActions ?? record.immediate_actions));
    lines.push("");
  }
  if (record.attachments || record.files) {
    lines.push("--- ATTACHED EVIDENCE / FILES ---");
    const files = record.attachments ?? record.files;
    if (Array.isArray(files)) {
      lines.push(...formatBulletArray(files));
    } else {
      lines.push(`  ${String(files)}`);
    }
    lines.push("");
  }

  // ====================================================
  // 3. DEVIATION WORKFLOW SECTIONS
  // ====================================================
  if (
    rawType === "Deviation" ||
    record.rca ||
    record.capa ||
    record.impact_assessment
  ) {
    // Impact Assessment
    const imp = record.impact_assessment ?? record.imp;
    if (imp) {
      lines.push("--- IMPACT ASSESSMENT ---");
      if (imp.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${imp.confidence_score}%`);

      const impMap = imp.impact_assessment ?? imp;
      if (impMap && typeof impMap === "object") {
        for (const [key, val] of Object.entries(
          impMap as Record<string, any>,
        )) {
          if (key === "confidence_score") continue;
          const categoryName =
            PARAMETER_LABELS[key] ?? key.replace(/_/g, " ").toUpperCase();
          lines.push(`\n[${categoryName}]`);
          lines.push(`  * Severity: ${val?.severity ?? "N/A"}`);
          lines.push(
            `  * Rationale: ${val?.rationale ?? val?.description ?? "—"}`,
          );
        }
      }
      lines.push("");
    }

    // Root Cause Analysis (RCA)
    const rca = record.rca ?? record.root_cause_analysis;
    if (rca) {
      lines.push("--- ROOT CAUSE ANALYSIS (RCA) ---");
      if (rca.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${rca.confidence_score}%`);

      lines.push("\nSequence of Events:");
      lines.push(...formatBulletArray(rca.sequence_of_events));

      lines.push(
        `\nUnderlying Root Cause:\n  ${rca.primary_root_cause || "—"}`,
      );
      lines.push(`\nImmediate Cause:\n  ${rca.immediate_cause || "—"}`);

      lines.push("\nContributing Factors:");
      lines.push(...formatBulletArray(rca.contributing_factors));

      lines.push("\nSupporting Evidence:");
      lines.push(...formatBulletArray(rca.evidence));

      lines.push(`\nImpact Summary:\n  ${rca.impact_summary || "—"}`);
      lines.push("");
    }

    // Corrective & Preventive Actions (CAPA)
    const capa = record.capa;
    if (capa) {
      lines.push("--- CORRECTIVE & PREVENTIVE ACTIONS (CAPA) ---");
      if (capa.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${capa.confidence_score}%`);
      lines.push(`CAPA Required: ${capa.capa_required ? "Yes" : "No"}`);

      lines.push("\nCorrective Actions:");
      lines.push(...formatBulletArray(capa.corrective_actions));

      lines.push("\nPreventive Actions:");
      lines.push(...formatBulletArray(capa.preventive_actions));

      lines.push(
        `\nEffectiveness Check:\n  ${capa.effectiveness_check || "—"}`,
      );
      lines.push(`\nDue Date:\n  ${capa.due_date || "—"}`);
      lines.push("");
    }
  }

  // ====================================================
  // 4. CHANGE CONTROL WORKFLOW SECTIONS
  // ====================================================
  if (
    rawType === "Change Control" ||
    record.change_impact_assessment ||
    record.validation_testing ||
    record.implementation_control
  ) {
    // Change Impact Assessment
    const impact = record.change_impact_assessment;
    if (impact) {
      lines.push("--- CHANGE IMPACT ASSESSMENT ---");
      if (impact.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${impact.confidence_score}%`);

      lines.push(
        `\n${CHANGE_IMPACT_FIELD_LABELS?.impacted_systems ?? "Impacted Systems"}:`,
      );
      lines.push(...formatBulletArray(impact.impacted_systems));

      if (impact.gxp_classification) {
        lines.push(
          `\n${CHANGE_IMPACT_FIELD_LABELS?.gxp_classification ?? "GxP Classification"}:`,
        );
        lines.push(
          `  * Classification: ${impact.gxp_classification.value ?? "N/A"}`,
        );
        lines.push(
          `  * Rationale: ${impact.gxp_classification.rationale ?? "—"}`,
        );
      }

      if (impact.data_validation_impact) {
        lines.push(
          `\n${CHANGE_IMPACT_FIELD_LABELS?.data_validation_impact ?? "Data & Validation Impact"}:`,
        );
        lines.push(
          `  * Validated State: ${impact.data_validation_impact.validated_state_affected ? "Affected" : "Not Affected"}`,
        );
        lines.push(
          `  * Rationale: ${impact.data_validation_impact.rationale ?? "—"}`,
        );
      }

      lines.push(
        `\n${CHANGE_IMPACT_FIELD_LABELS?.downstream_dependencies ?? "Downstream Dependencies"}:`,
      );
      lines.push(...formatBulletArray(impact.downstream_dependencies));

      if (impact.risk_scoring) {
        lines.push(
          `\n${CHANGE_IMPACT_FIELD_LABELS?.risk_scoring ?? "Risk Scoring"}:`,
        );
        lines.push(`  * Level: ${impact.risk_scoring.level ?? "N/A"} Risk`);
        lines.push(`  * Rationale: ${impact.risk_scoring.rationale ?? "—"}`);
      }
      lines.push("");
    }

    // Risk & Criticality Evaluation
    const risk = record.risk_criticality;
    if (risk) {
      lines.push("--- RISK & CRITICALITY EVALUATION ---");
      if (risk.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${risk.confidence_score}%`);

      if (risk.patient_safety_product_quality_impact) {
        lines.push(
          `\n${RISK_FIELD_LABELS?.patient_safety_product_quality_impact ?? "Patient Safety & Product Quality Impact"}:`,
        );
        lines.push(
          `  * Risk Level: ${risk.patient_safety_product_quality_impact.level ?? "N/A"}`,
        );
        lines.push(
          `  * Rationale: ${risk.patient_safety_product_quality_impact.rationale ?? "—"}`,
        );
      }

      if (risk.regulatory_impact) {
        lines.push(
          `\n${RISK_FIELD_LABELS?.regulatory_impact ?? "Regulatory Impact"}:`,
        );
        lines.push(`  * Risk Level: ${risk.regulatory_impact.level ?? "N/A"}`);
        lines.push("  * Filings / Submissions Affected:");
        lines.push(
          ...formatBulletArray(
            risk.regulatory_impact.filings_or_submissions_affected,
          ),
        );
        lines.push(`  * Rationale: ${risk.regulatory_impact.rationale ?? "—"}`);
      }

      if (risk.data_integrity_risk) {
        lines.push(
          `\n${RISK_FIELD_LABELS?.data_integrity_risk ?? "Data Integrity Risk"}:`,
        );
        lines.push(
          `  * Risk Level: ${risk.data_integrity_risk.level ?? "N/A"}`,
        );
        lines.push(
          `  * Rationale: ${risk.data_integrity_risk.rationale ?? "—"}`,
        );
      }

      if (risk.operational_disruption_risk) {
        lines.push(
          `\n${RISK_FIELD_LABELS?.operational_disruption_risk ?? "Operational Disruption Risk"}:`,
        );
        lines.push(
          `  * Risk Level: ${risk.operational_disruption_risk.level ?? "N/A"}`,
        );
        lines.push(
          `  * Rationale: ${risk.operational_disruption_risk.rationale ?? "—"}`,
        );
      }

      lines.push(
        `\nRisk Ranking Justification:\n  ${risk.risk_ranking_justification || "—"}`,
      );
      lines.push("");
    }

    // Validation & Testing Strategy
    const val = record.validation_testing;
    if (val) {
      lines.push("--- VALIDATION & TESTING STRATEGY ---");
      if (val.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${val.confidence_score}%`);

      if (val.required_validation_level) {
        lines.push(
          `\n${VALIDATION_TESTING_FIELD_LABELS?.required_validation_level ?? "Required Validation Level"}:`,
        );
        lines.push(
          `  * Level: ${val.required_validation_level.level ?? "N/A"}`,
        );
        lines.push(
          `  * Rationale: ${val.required_validation_level.rationale ?? "—"}`,
        );
      }

      lines.push(
        `\n${VALIDATION_TESTING_FIELD_LABELS?.scenario_based_testing ?? "Scenario-Based Testing"}:`,
      );
      lines.push(...formatBulletArray(val.scenario_based_testing));

      lines.push(
        `\n${VALIDATION_TESTING_FIELD_LABELS?.regression_scope ?? "Regression Scope"}:`,
      );
      lines.push(...formatBulletArray(val.regression_scope));

      lines.push(
        `\n${VALIDATION_TESTING_FIELD_LABELS?.uat_requirements ?? "UAT Requirements"}:`,
      );
      lines.push(...formatBulletArray(val.uat_requirements));

      lines.push(
        `\n${VALIDATION_TESTING_FIELD_LABELS?.traceability ?? "Traceability Matrix"}:`,
      );
      lines.push(...formatBulletArray(val.traceability));
      lines.push("");
    }

    // Implementation & Control Actions
    const impCtrl = record.implementation_control;
    if (impCtrl) {
      lines.push("--- IMPLEMENTATION & CONTROL ACTIONS ---");
      if (impCtrl.confidence_score !== undefined)
        lines.push(`Overall Confidence: ${impCtrl.confidence_score}%`);

      lines.push(
        `\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.required_actions ?? "Required Actions"}:`,
      );
      lines.push(...formatBulletArray(impCtrl.required_actions));

      lines.push(
        `\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.sop_wi_updates ?? "SOP & WI Updates"}:`,
      );
      lines.push(...formatBulletArray(impCtrl.sop_wi_updates));

      lines.push(
        `\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.approval_routing ?? "Approval Routing"}:`,
      );
      lines.push(...formatBulletArray(impCtrl.approval_routing));

      lines.push(
        `\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.implementation_plan ?? "Implementation Plan"}:\n  ${impCtrl.implementation_plan || "—"}`,
      );
      lines.push(
        `\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.rollback_contingency_plan ?? "Rollback & Contingency Plan"}:\n  ${impCtrl.rollback_contingency_plan || "—"}`,
      );
      lines.push("");
    }
  }

  // 5. FINAL SUMMARY (Included for BOTH Deviation & Change Control)
  if (record.final_summary || record.summary) {
    lines.push("--- FINAL SUMMARY ---");
    const summaryVal = record.final_summary ?? record.summary;
    if (typeof summaryVal === "string") {
      lines.push(summaryVal);
    } else {
      lines.push(JSON.stringify(summaryVal, null, 2));
    }
    lines.push("");
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

function triggerBlobDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ====================================================================
// Shared document "theme" — used by BOTH the PDF and Word exporters so
// that whichever format the user picks, the report looks the same.
// ====================================================================
const DOC_THEME = {
  brand: { r: 37, g: 99, b: 235, hex: "2563EB" }, // blue-600
  dark: { r: 30, g: 41, b: 59, hex: "1E293B" }, // slate-800
  muted: { r: 100, g: 116, b: 139, hex: "64748B" }, // slate-500
  sectionFill: { r: 239, g: 246, b: 255, hex: "EFF6FF" }, // blue-50
  divider: { r: 226, g: 232, b: 240, hex: "E2E8F0" }, // slate-200
};

type ParsedSummaryLine =
  | { type: "title"; text: string }
  | { type: "meta"; label: string; value: string }
  | { type: "section"; text: string }
  | { type: "subheader"; text: string }
  | { type: "bullet"; text: string }
  | { type: "divider" }
  | { type: "blank" }
  | { type: "text"; text: string };

// Parses the plain-text summary report (produced by buildFullSummaryText)
// into typed lines so both the PDF and Word generators can render matching
// headings, sections, and bullets instead of a flat text dump.
function parseSummaryLines(raw: string): ParsedSummaryLine[] {
  const parsed: ParsedSummaryLine[] = [];

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();

    if (/^=+$/.test(line) || /^-{10,}$/.test(line)) {
      parsed.push({ type: "divider" });
      continue;
    }
    if (line === "") {
      parsed.push({ type: "blank" });
      continue;
    }
    if (/^-{3}\s.+\s-{3}$/.test(line)) {
      parsed.push({
        type: "section",
        text: line.replace(/^-{3}\s|\s-{3}$/g, ""),
      });
      continue;
    }
    if (/^\[.+]$/.test(line)) {
      parsed.push({ type: "subheader", text: line.replace(/^\[|]$/g, "") });
      continue;
    }
    if (/^[*-]\s+/.test(line)) {
      parsed.push({ type: "bullet", text: line.replace(/^[*-]\s+/, "") });
      continue;
    }
    if (/^[A-Za-z][A-Za-z /]{2,40}:\s+\S/.test(line)) {
      const idx = line.indexOf(":");
      parsed.push({
        type: "meta",
        label: line.slice(0, idx),
        value: line.slice(idx + 1).trim(),
      });
      continue;
    }
    if (
      line === line.toUpperCase() &&
      /[A-Z]{4,}/.test(line) &&
      line.length > 6 &&
      line.length < 60
    ) {
      parsed.push({ type: "title", text: line });
      continue;
    }
    parsed.push({ type: "text", text: line });
  }

  return parsed;
}

// ---- PDF export --------------------------------------------------------

export function downloadSummaryAsPDF(
  filename: string,
  record: any,
  caseTypeLabel: string,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 56;
  let y = 0;

  const setColor = (
    target: "text" | "fill" | "draw",
    c: { r: number; g: number; b: number },
  ) => {
    if (target === "text") doc.setTextColor(c.r, c.g, c.b);
    if (target === "fill") doc.setFillColor(c.r, c.g, c.b);
    if (target === "draw") doc.setDrawColor(c.r, c.g, c.b);
  };

  const addTopBar = () => {
    setColor("fill", DOC_THEME.brand);
    doc.rect(0, 0, pageWidth, 6, "F");
  };

  const addFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor("text", DOC_THEME.muted);
    doc.text(
      `Page ${doc.getNumberOfPages()}`,
      pageWidth - marginX,
      pageHeight - 24,
      { align: "right" },
    );
    doc.text(
      "Confidential — Quality Management System",
      marginX,
      pageHeight - 24,
    );
  };

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > bottomLimit) {
      addFooter();
      doc.addPage();
      addTopBar();
      y = 56;
    }
  };

  addTopBar();
  y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor("text", DOC_THEME.dark);
  doc.text("Quality Management System Report", marginX, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor("text", DOC_THEME.muted);
  doc.text(
    `${caseTypeLabel} · Record #${record.id ?? record.uiId ?? "N/A"}`,
    marginX,
    y,
  );
  y += 12;

  setColor("draw", DOC_THEME.divider);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 26;

  const parsed = parseSummaryLines(
    buildFullSummaryText({ ...record, case_type: caseTypeLabel }),
  );

  for (const line of parsed) {
    switch (line.type) {
      case "title":
        break;

      case "divider":
        ensureSpace(14);
        setColor("draw", DOC_THEME.divider);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 14;
        break;

      case "blank":
        y += 8;
        break;

      case "meta": {
        ensureSpace(16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        setColor("text", DOC_THEME.dark);
        doc.text(`${line.label}:`, marginX, y);
        const labelWidth = doc.getTextWidth(`${line.label}: `);
        doc.setFont("helvetica", "normal");
        setColor("text", DOC_THEME.muted);
        doc.text(String(line.value), marginX + labelWidth + 2, y);
        y += 16;
        break;
      }

      case "section": {
        y += 6;
        ensureSpace(26);
        setColor("fill", DOC_THEME.sectionFill);
        doc.rect(marginX, y - 12, contentWidth, 20, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setColor("text", DOC_THEME.brand);
        doc.text(line.text.toUpperCase(), marginX + 6, y + 2);
        y += 24;
        break;
      }

      case "subheader":
        ensureSpace(16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        setColor("text", DOC_THEME.dark);
        doc.text(line.text, marginX, y);
        y += 15;
        break;

      case "bullet": {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const wrapped = doc.splitTextToSize(
          line.text,
          contentWidth - 16,
        ) as string[];
        wrapped.forEach((w, i) => {
          ensureSpace(13);
          if (i === 0) {
            setColor("text", DOC_THEME.brand);
            doc.text("•", marginX + 4, y);
          }
          setColor("text", DOC_THEME.dark);
          doc.text(w, marginX + 16, y);
          y += 13;
        });
        break;
      }

      default: {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        setColor("text", DOC_THEME.dark);
        const wrapped = doc.splitTextToSize(
          line.text,
          contentWidth,
        ) as string[];
        wrapped.forEach((w) => {
          ensureSpace(13);
          doc.text(w, marginX, y);
          y += 13;
        });
        break;
      }
    }
  }

  addFooter();
  doc.save(filename);
}

// ---- Word (.docx) export ------------------------------------------------

export async function downloadSummaryAsWord(
  filename: string,
  record: any,
  caseTypeLabel: string,
): Promise<void> {
  const parsed = parseSummaryLines(
    buildFullSummaryText({ ...record, case_type: caseTypeLabel }),
  );

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "Quality Management System Report",
          bold: true,
          size: 32,
          color: DOC_THEME.dark.hex,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: {
          color: DOC_THEME.divider.hex,
          style: BorderStyle.SINGLE,
          size: 6,
          space: 4,
        },
      },
      children: [
        new TextRun({
          text: `${caseTypeLabel} · Record #${record.id ?? record.uiId ?? "N/A"}`,
          color: DOC_THEME.muted.hex,
          size: 20,
        }),
      ],
    }),
  ];

  for (const line of parsed) {
    switch (line.type) {
      case "title":
      case "divider":
        break;

      case "blank":
        children.push(new Paragraph({ text: "" }));
        break;

      case "meta":
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${line.label}: `,
                bold: true,
                color: DOC_THEME.dark.hex,
                size: 20,
              }),
              new TextRun({
                text: String(line.value),
                color: DOC_THEME.muted.hex,
                size: 20,
              }),
            ],
          }),
        );
        break;

      case "section":
        children.push(
          new Paragraph({
            shading: { fill: DOC_THEME.sectionFill.hex },
            spacing: { before: 260, after: 120 },
            children: [
              new TextRun({
                text: line.text.toUpperCase(),
                bold: true,
                color: DOC_THEME.brand.hex,
                size: 22,
              }),
            ],
          }),
        );
        break;

      case "subheader":
        children.push(
          new Paragraph({
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: line.text,
                bold: true,
                color: DOC_THEME.dark.hex,
                size: 20,
              }),
            ],
          }),
        );
        break;

      case "bullet":
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: line.text,
                color: DOC_THEME.dark.hex,
                size: 20,
              }),
            ],
          }),
        );
        break;

      default:
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: line.text,
                color: DOC_THEME.dark.hex,
                size: 20,
              }),
            ],
          }),
        );
        break;
    }
  }

  const wordDoc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(wordDoc);
  triggerBlobDownload(filename, blob);
}

// ---- Shared "Download Summary" popup ------------------------------------
//
// Renders the Download Summary trigger button + a small popup menu offering
// PDF / Word. Built entirely from theme tokens (bg-popover, border, etc.)
// so it renders correctly in both light and dark mode without extra work.

export function DownloadSummaryMenu({
  record,
  caseType,
  fileBaseName,
  className,
}: {
  record: any;
  caseType: string;
  fileBaseName: string;
  className?: string;
}) {
  const handlePdf = () =>
    downloadSummaryAsPDF(`${fileBaseName}.pdf`, record, caseType);
  const handleWord = () => {
    void downloadSummaryAsWord(`${fileBaseName}.docx`, record, caseType);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            className ??
            "h-9 px-5 rounded-md border border-border bg-background text-foreground text-xs font-medium shadow-sm hover:bg-muted hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
          }
        >
          <Download className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>Download Summary</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-popover text-popover-foreground border-border"
      >
        <DropdownMenuItem onClick={handlePdf} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-500 dark:text-red-400" />
          <span>Download as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWord} className="gap-2 cursor-pointer">
          <FileType2 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          <span>Download as Word</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
