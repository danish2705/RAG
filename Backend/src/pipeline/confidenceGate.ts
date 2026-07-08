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

/**
 * Shape shared by every stage's parsed output that the gate cares about.
 * Each stage's real schema (Classification/RCA/CAPA) is a superset of this.
 */
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

/**
 * Feature 2: gate evaluated after every stage (classification, RCA, CAPA).
 *
 * IMPORTANT — this does NOT stop the chain on low confidence alone.
 * It stops on any of the following, each one independently sufficient:
 *
 *   1. low_confidence            confidence_score < CONFIDENCE_THRESHOLD
 *   2. missing_confidence_score  the field is absent / not a number
 *   3. invalid_output            LLM output didn't parse as JSON, or failed
 *                                 zod schema validation (replaces the
 *                                 notebook's silent fallback to "deviation")
 *   4. blocking_classification   classification stage resolved to
 *                                 "Out of Scope" / "Wrong Process (Redirect)"
 *   5. insufficient_evidence     RCA stage returned an empty evidence array
 *
 * Any one of these routes the case to manual/human handling (HITL-06 in the
 * requirements doc: "Gating and manual routing for low confidence, missing
 * inputs, or out-of-distribution cases" — confidence is one trigger among
 * several, not the only one).
 */
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

/**
 * Builds a GateResult directly for the "insufficient_input" case — used
 * when the classification stage returned { insufficient_input: true, reason }
 * instead of a real ClassificationResult. This is NOT run through
 * evaluateGate() because that function assumes a GatedStageOutput shape;
 * insufficient_input is a deliberately different, valid response shape from
 * the LLM (see prompts/deviation.ts STEP 1), not a parse/validation error.
 */
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
