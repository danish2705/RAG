import { type ChangeImpactAssessmentStageResult } from "./impactAssessment.js";
import { type RiskCriticalityStageResult } from "./riskCriticality.js";
import { type ValidationTestingStageResult } from "./validationTesting.js";
import { type ImplementationControlStageResult } from "./implementationControl.js";
import { type FinalSummaryStageResult } from "./summary.js";
import { type GateResult } from "../confidenceGate.js";
import { type AuditEntry } from "../../utils/auditLogger.js";
import type { ClassificationResult } from "../../llm/schemas/deviation.js";
import type { ChangeImpactAssessmentResult, RiskCriticalityResult, ValidationTestingResult, ImplementationControlResult } from "../../llm/schemas/changeControl.js";
export type PipelineStatus = "halted_for_human_review" | "completed_pending_human_review";
export type HaltedStage = "change_impact_assessment" | "risk_criticality" | "validation_testing" | "implementation_control" | "final_summary" | null;
export interface PipelineStages {
    changeImpactAssessment?: ChangeImpactAssessmentStageResult & {
        gate: GateResult;
    };
    riskCriticality?: RiskCriticalityStageResult & {
        gate: GateResult;
    };
    validationTesting?: ValidationTestingStageResult & {
        gate: GateResult;
    };
    implementationControl?: ImplementationControlStageResult & {
        gate: GateResult;
    };
    finalSummary?: FinalSummaryStageResult & {
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
 * Stage 1 ONLY: Change Impact Assessment. Call only after a human has
 * accepted/overridden the upstream (shared) "Change Control" classification.
 */
export declare function runChangeImpactAssessmentOnly(query: string, contextText: string, approvedClassification: ClassificationResult): Promise<PipelineResult>;
/**
 * Stage 2 ONLY: Risk & Criticality Evaluation. Call only after a human has
 * accepted/overridden Stage 1.
 */
export declare function runRiskCriticalityOnly(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult): Promise<PipelineResult>;
/**
 * Stage 3 ONLY: Validation & Testing Strategy. Call only after a human has
 * accepted/overridden Stage 2.
 */
export declare function runValidationTestingOnly(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult): Promise<PipelineResult>;
/**
 * Stage 4 ONLY: Implementation & Control Actions. Call only after a human
 * has accepted/overridden Stage 3.
 */
export declare function runImplementationControlOnly(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult, approvedValidationTesting: ValidationTestingResult): Promise<PipelineResult>;
/**
 * Stage 5 ONLY: Final Change Control Summary. Call only after a human has
 * accepted/overridden Stage 4. Advisory only — never auto-approves.
 */
export declare function runFinalSummaryOnly(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult, approvedValidationTesting: ValidationTestingResult, approvedImplementationControl: ImplementationControlResult): Promise<PipelineResult>;
