import React from "react";
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

// Helper to format string arrays as clean bullet points for text reports
function formatBulletArray(items?: string[]): string[] {
  if (!items || !Array.isArray(items) || items.length === 0) return ["  — None"];
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
  const submittedBy = record.saved_by ?? record.submittedBy ?? record.user ?? "N/A";
  const timestamp = safeFormatDate(record.created_at ?? record.savedOn ?? record.timestamp ?? record.updatedOn);
  const status = record.status ?? "Verified & Archived";
  const site = record.site ?? record.location ?? "N/A";
  const sourceSystem = record.sourceSystem ?? record.source_system ?? "N/A";
  const department = record.department ?? "N/A";
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
    if (cls.confidence_score !== undefined) lines.push(`AI Confidence Score: ${cls.confidence_score}%`);
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
  if (rawType === "Deviation" || record.rca || record.capa || record.impact_assessment) {
    
    // Impact Assessment
    const imp = record.impact_assessment ?? record.imp;
    if (imp) {
      lines.push("--- IMPACT ASSESSMENT ---");
      if (imp.confidence_score !== undefined) lines.push(`Overall Confidence: ${imp.confidence_score}%`);
      
      const impMap = imp.impact_assessment ?? imp;
      if (impMap && typeof impMap === "object") {
        for (const [key, val] of Object.entries(impMap as Record<string, any>)) {
          if (key === "confidence_score") continue;
          const categoryName = PARAMETER_LABELS[key] ?? key.replace(/_/g, " ").toUpperCase();
          lines.push(`\n[${categoryName}]`);
          lines.push(`  * Severity: ${val?.severity ?? "N/A"}`);
          lines.push(`  * Rationale: ${val?.rationale ?? val?.description ?? "—"}`);
        }
      }
      lines.push("");
    }

    // Root Cause Analysis (RCA)
    const rca = record.rca ?? record.root_cause_analysis;
    if (rca) {
      lines.push("--- ROOT CAUSE ANALYSIS (RCA) ---");
      if (rca.confidence_score !== undefined) lines.push(`Overall Confidence: ${rca.confidence_score}%`);
      
      lines.push("\nSequence of Events:");
      lines.push(...formatBulletArray(rca.sequence_of_events));
      
      lines.push(`\nUnderlying Root Cause:\n  ${rca.primary_root_cause || "—"}`);
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
      if (capa.confidence_score !== undefined) lines.push(`Overall Confidence: ${capa.confidence_score}%`);
      lines.push(`CAPA Required: ${capa.capa_required ? "Yes" : "No"}`);
      
      lines.push("\nCorrective Actions:");
      lines.push(...formatBulletArray(capa.corrective_actions));
      
      lines.push("\nPreventive Actions:");
      lines.push(...formatBulletArray(capa.preventive_actions));
      
      lines.push(`\nEffectiveness Check:\n  ${capa.effectiveness_check || "—"}`);
      lines.push(`\nDue Date:\n  ${capa.due_date || "—"}`);
      lines.push("");
    }
  }

  // ====================================================
  // 4. CHANGE CONTROL WORKFLOW SECTIONS
  // ====================================================
  if (rawType === "Change Control" || record.change_impact_assessment || record.validation_testing || record.implementation_control) {
    
    // Change Impact Assessment
    const impact = record.change_impact_assessment;
    if (impact) {
      lines.push("--- CHANGE IMPACT ASSESSMENT ---");
      if (impact.confidence_score !== undefined) lines.push(`Overall Confidence: ${impact.confidence_score}%`);
      
      lines.push(`\n${CHANGE_IMPACT_FIELD_LABELS?.impacted_systems ?? "Impacted Systems"}:`);
      lines.push(...formatBulletArray(impact.impacted_systems));
      
      if (impact.gxp_classification) {
        lines.push(`\n${CHANGE_IMPACT_FIELD_LABELS?.gxp_classification ?? "GxP Classification"}:`);
        lines.push(`  * Classification: ${impact.gxp_classification.value ?? "N/A"}`);
        lines.push(`  * Rationale: ${impact.gxp_classification.rationale ?? "—"}`);
      }
      
      if (impact.data_validation_impact) {
        lines.push(`\n${CHANGE_IMPACT_FIELD_LABELS?.data_validation_impact ?? "Data & Validation Impact"}:`);
        lines.push(`  * Validated State: ${impact.data_validation_impact.validated_state_affected ? "Affected" : "Not Affected"}`);
        lines.push(`  * Rationale: ${impact.data_validation_impact.rationale ?? "—"}`);
      }
      
      lines.push(`\n${CHANGE_IMPACT_FIELD_LABELS?.downstream_dependencies ?? "Downstream Dependencies"}:`);
      lines.push(...formatBulletArray(impact.downstream_dependencies));
      
      if (impact.risk_scoring) {
        lines.push(`\n${CHANGE_IMPACT_FIELD_LABELS?.risk_scoring ?? "Risk Scoring"}:`);
        lines.push(`  * Level: ${impact.risk_scoring.level ?? "N/A"} Risk`);
        lines.push(`  * Rationale: ${impact.risk_scoring.rationale ?? "—"}`);
      }
      lines.push("");
    }

    // Risk & Criticality Evaluation
    const risk = record.risk_criticality;
    if (risk) {
      lines.push("--- RISK & CRITICALITY EVALUATION ---");
      if (risk.confidence_score !== undefined) lines.push(`Overall Confidence: ${risk.confidence_score}%`);
      
      if (risk.patient_safety_product_quality_impact) {
        lines.push(`\n${RISK_FIELD_LABELS?.patient_safety_product_quality_impact ?? "Patient Safety & Product Quality Impact"}:`);
        lines.push(`  * Risk Level: ${risk.patient_safety_product_quality_impact.level ?? "N/A"}`);
        lines.push(`  * Rationale: ${risk.patient_safety_product_quality_impact.rationale ?? "—"}`);
      }
      
      if (risk.regulatory_impact) {
        lines.push(`\n${RISK_FIELD_LABELS?.regulatory_impact ?? "Regulatory Impact"}:`);
        lines.push(`  * Risk Level: ${risk.regulatory_impact.level ?? "N/A"}`);
        lines.push("  * Filings / Submissions Affected:");
        lines.push(...formatBulletArray(risk.regulatory_impact.filings_or_submissions_affected));
        lines.push(`  * Rationale: ${risk.regulatory_impact.rationale ?? "—"}`);
      }
      
      if (risk.data_integrity_risk) {
        lines.push(`\n${RISK_FIELD_LABELS?.data_integrity_risk ?? "Data Integrity Risk"}:`);
        lines.push(`  * Risk Level: ${risk.data_integrity_risk.level ?? "N/A"}`);
        lines.push(`  * Rationale: ${risk.data_integrity_risk.rationale ?? "—"}`);
      }
      
      if (risk.operational_disruption_risk) {
        lines.push(`\n${RISK_FIELD_LABELS?.operational_disruption_risk ?? "Operational Disruption Risk"}:`);
        lines.push(`  * Risk Level: ${risk.operational_disruption_risk.level ?? "N/A"}`);
        lines.push(`  * Rationale: ${risk.operational_disruption_risk.rationale ?? "—"}`);
      }
      
      lines.push(`\nRisk Ranking Justification:\n  ${risk.risk_ranking_justification || "—"}`);
      lines.push("");
    }

    // Validation & Testing Strategy
    const val = record.validation_testing;
    if (val) {
      lines.push("--- VALIDATION & TESTING STRATEGY ---");
      if (val.confidence_score !== undefined) lines.push(`Overall Confidence: ${val.confidence_score}%`);
      
      if (val.required_validation_level) {
        lines.push(`\n${VALIDATION_TESTING_FIELD_LABELS?.required_validation_level ?? "Required Validation Level"}:`);
        lines.push(`  * Level: ${val.required_validation_level.level ?? "N/A"}`);
        lines.push(`  * Rationale: ${val.required_validation_level.rationale ?? "—"}`);
      }
      
      lines.push(`\n${VALIDATION_TESTING_FIELD_LABELS?.scenario_based_testing ?? "Scenario-Based Testing"}:`);
      lines.push(...formatBulletArray(val.scenario_based_testing));
      
      lines.push(`\n${VALIDATION_TESTING_FIELD_LABELS?.regression_scope ?? "Regression Scope"}:`);
      lines.push(...formatBulletArray(val.regression_scope));
      
      lines.push(`\n${VALIDATION_TESTING_FIELD_LABELS?.uat_requirements ?? "UAT Requirements"}:`);
      lines.push(...formatBulletArray(val.uat_requirements));
      
      lines.push(`\n${VALIDATION_TESTING_FIELD_LABELS?.traceability ?? "Traceability Matrix"}:`);
      lines.push(...formatBulletArray(val.traceability));
      lines.push("");
    }

    // Implementation & Control Actions
    const impCtrl = record.implementation_control;
    if (impCtrl) {
      lines.push("--- IMPLEMENTATION & CONTROL ACTIONS ---");
      if (impCtrl.confidence_score !== undefined) lines.push(`Overall Confidence: ${impCtrl.confidence_score}%`);
      
      lines.push(`\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.required_actions ?? "Required Actions"}:`);
      lines.push(...formatBulletArray(impCtrl.required_actions));
      
      lines.push(`\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.sop_wi_updates ?? "SOP & WI Updates"}:`);
      lines.push(...formatBulletArray(impCtrl.sop_wi_updates));
      
      lines.push(`\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.approval_routing ?? "Approval Routing"}:`);
      lines.push(...formatBulletArray(impCtrl.approval_routing));
      
      lines.push(`\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.implementation_plan ?? "Implementation Plan"}:\n  ${impCtrl.implementation_plan || "—"}`);
      lines.push(`\n${IMPLEMENTATION_CONTROL_FIELD_LABELS?.rollback_contingency_plan ?? "Rollback & Contingency Plan"}:\n  ${impCtrl.rollback_contingency_plan || "—"}`);
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