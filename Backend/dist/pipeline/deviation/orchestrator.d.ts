import { type ClassificationStageResult } from "./classify.js";
import { type ImpactAssessmentStageResult } from "./impactAssessment.js";
import { type RCAStageResult } from "./rca.js";
import { type CAPAStageResult } from "./capa.js";
import { type GateResult } from "../confidenceGate.js";
import { type AuditEntry } from "../../utils/auditLogger.js";
import type { ClassificationResult, ImpactAssessmentResult } from "../../llm/schemas/deviation.js";
export type PipelineStatus = "halted_for_human_review" | "completed_pending_human_review";
export type HaltedStage = "classification" | "impact_assessment" | "rca" | "capa" | null;
export interface PipelineStages {
    classification?: ClassificationStageResult & {
        gate: GateResult;
    };
    impactAssessment?: ImpactAssessmentStageResult & {
        gate: GateResult;
    };
    rca?: RCAStageResult & {
        gate: GateResult;
    };
    capa?: CAPAStageResult & {
        gate: GateResult;
    };
}
export interface PipelineResult {
    status: PipelineStatus;
    haltedAt: HaltedStage;
    stages: PipelineStages;
    auditTrail: AuditEntry[];
}
/**
 * Stage 1 ONLY: classification/routing. This is the entire job of
 * POST /api/inputQuery. It does NOT run impact assessment, RCA, or CAPA —
 * those each require a separate human approval step in the frontend before
 * their corresponding endpoint is even called. This is the fix for the
 * "everything runs together" bug: each exported function here is one LLM
 * round trip, gated, and returned to the frontend for a human decision
 * before the next function is ever invoked.
 */
export declare function runClassificationOnly(query: string, contextText: string): Promise<PipelineResult>;
/**
 * Stage 2 ONLY: impact/severity assessment. Call this only after a human
 * has accepted or overridden the Stage 1 classification — never
 * automatically and never in the same request as runClassificationOnly().
 *
 * `approvedClassification` is the classification the human confirmed
 * (identical to what Stage 1 returned, unless they overrode it — in which
 * case the frontend should send the overridden values).
 */
export declare function runImpactAssessmentOnly(query: string, contextText: string, approvedClassification: ClassificationResult): Promise<PipelineResult>;
/**
 * Stage 3 ONLY: root cause analysis. Call only after impact assessment has
 * been accepted/overridden by a human.
 *
 * `approvedImpactAssessment` is the Stage 2 result the human confirmed
 * (identical to what Stage 2 returned, unless they overrode it — in which
 * case the frontend should send the overridden values). RCA is passed the
 * FULL upstream chain (classification + impact assessment), not just the
 * immediately-previous stage, so investigation depth scales with severity.
 */
export declare function runRCAOnly(query: string, contextText: string, approvedClassification: ClassificationResult, approvedImpactAssessment: ImpactAssessmentResult): Promise<PipelineResult>;
/**
 * Stage 4 ONLY: CAPA recommendations. Call only after RCA has been
 * accepted/overridden by a human. Even a fully-passed chain is advisory
 * only — never auto-approved/closed.
 *
 * Receives the FULL approved chain — classification, impact assessment,
 * and RCA — not just RCA alone, so recommended actions can be sized to
 * severity and traced back to the specific root cause.
 */
export declare function runCAPAOnly(query: string, approvedClassification: ClassificationResult, approvedImpactAssessment: ImpactAssessmentResult, approvedRCA: RCAStageResult["parsed"]): Promise<PipelineResult>;
