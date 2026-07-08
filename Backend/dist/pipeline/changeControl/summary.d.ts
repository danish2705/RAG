import { type FinalChangeControlSummaryResult, type ChangeImpactAssessmentResult, type RiskCriticalityResult, type ValidationTestingResult, type ImplementationControlResult } from "../../llm/schemas/changeControl.js";
export interface FinalSummaryStageResult {
    rawText: string;
    parsed: FinalChangeControlSummaryResult | null;
    error: Error | null;
}
/**
 * Stage 5 of 5: final change control summary. Runs only after a human has
 * accepted/overridden Stage 4 (Implementation & Control Actions). Advisory
 * only — never auto-approves/rejects the change.
 */
export declare function runFinalSummaryStage(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult, approvedValidationTesting: ValidationTestingResult, approvedImplementationControl: ImplementationControlResult): Promise<FinalSummaryStageResult>;
