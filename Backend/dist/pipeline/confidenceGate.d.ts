export type StageName = "classification" | "rca" | "capa" | "change_impact_assessment" | "risk_criticality" | "validation_testing" | "implementation_control" | "final_summary";
export type GateReasonCode = "invalid_output" | "missing_confidence_score" | "low_confidence" | "blocking_classification" | "insufficient_evidence";
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
export declare function evaluateGate(stageName: StageName, parsed: GatedStageOutput | null, validationError?: Error | null): GateResult;
