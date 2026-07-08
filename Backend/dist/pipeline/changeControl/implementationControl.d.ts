import { type ImplementationControlResult, type ChangeImpactAssessmentResult, type RiskCriticalityResult, type ValidationTestingResult } from "../../llm/schemas/changeControl.js";
export interface ImplementationControlStageResult {
    rawText: string;
    parsed: ImplementationControlResult | null;
    error: Error | null;
}
/**
 * Stage 4 of 5: implementation & control actions. Runs only after a human
 * has accepted/overridden Stage 3 (Validation & Testing Strategy). Receives
 * the full upstream chain so recommended actions/approval routing scale
 * with approved risk and validation rigor.
 */
export declare function runImplementationControlStage(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult, approvedValidationTesting: ValidationTestingResult): Promise<ImplementationControlStageResult>;
