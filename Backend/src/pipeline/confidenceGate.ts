import { config } from "../config.js";

export type StageName =
  | "classification"
  | "rca"
  | "capa"
  | "change_impact_assessment"
  | "risk_criticality"
  | "validation_testing"
  | "implementation_control"
  | "final_summary";

export type GateReasonCode =
  | "invalid_output"
  | "missing_confidence_score"
  | "low_confidence"
  | "blocking_classification"
  | "insufficient_evidence"
  | "insufficient_input";

export interface GateReason {
  code: GateReasonCode;
  detail: string | null;
}

export interface GateResult {
  stage: StageName;
  passed: boolean;
  reasons: GateReason[];
  routedTo: "manual_review_queue" | null;
}

export interface GatedStageOutput {
  confidence_score?: unknown;
  classification?: string;
  evidence?: unknown[];
}

// Classifications that should never proceed to RCA/CAPA automatically,
// regardless of confidence — they mean "this isn't even the right process".
const BLOCKING_CLASSIFICATIONS = new Set<string>([
  "Out of Scope",
  "Wrong Process (Redirect)",
]);

export function evaluateGate(
  stageName: StageName,
  parsed: GatedStageOutput | null,
  validationError: Error | null = null,
): GateResult {
  const reasons: GateReason[] = [];

  if (validationError) {
    reasons.push({
      code: "invalid_output",
      detail: validationError.message,
    });
  } else {
    const score = parsed?.confidence_score;

    if (typeof score !== "number" || Number.isNaN(score)) {
      reasons.push({ code: "missing_confidence_score", detail: null });
    } else if (score < config.gate.confidenceThreshold) {
      reasons.push({
        code: "low_confidence",
        detail: `${score} < threshold ${config.gate.confidenceThreshold}`,
      });
    }

    if (
      stageName === "classification" &&
      parsed?.classification !== undefined &&
      BLOCKING_CLASSIFICATIONS.has(parsed.classification)
    ) {
      reasons.push({
        code: "blocking_classification",
        detail: parsed.classification,
      });
    }

    if (
      stageName === "rca" &&
      Array.isArray(parsed?.evidence) &&
      parsed.evidence.length === 0
    ) {
      reasons.push({ code: "insufficient_evidence", detail: null });
    }
  }

  const passed = reasons.length === 0;

  return {
    stage: stageName,
    passed,
    reasons,
    routedTo: passed ? null : "manual_review_queue",
  };
}

export function buildInsufficientInputGate(
  stageName: StageName,
  reason: string,
): GateResult {
  return {
    stage: stageName,
    passed: false,
    reasons: [{ code: "insufficient_input", detail: reason }],
    routedTo: "manual_review_queue",
  };
}
