import { type ValidationTestingResult, type ChangeImpactAssessmentResult, type RiskCriticalityResult } from "../../llm/schemas/changeControl.js";
export interface ValidationTestingStageResult {
    rawText: string;
    parsed: ValidationTestingResult | null;
    error: Error | null;
}
/**
 * Stage 3 of 5: validation & testing strategy. Runs only after a human has
 * accepted/overridden Stage 2 (Risk & Criticality Evaluation). Receives the
 * full upstream chain so validation rigor scales with approved risk.
 */
export declare function runValidationTestingStage(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult, approvedRiskCriticality: RiskCriticalityResult): Promise<ValidationTestingStageResult>;
