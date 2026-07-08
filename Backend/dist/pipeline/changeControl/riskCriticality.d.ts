import { type RiskCriticalityResult, type ChangeImpactAssessmentResult } from "../../llm/schemas/changeControl.js";
export interface RiskCriticalityStageResult {
    rawText: string;
    parsed: RiskCriticalityResult | null;
    error: Error | null;
}
/**
 * Stage 2 of 5: risk & criticality evaluation. Runs only after a human has
 * accepted/overridden the Stage 1 Change Impact Assessment.
 */
export declare function runRiskCriticalityStage(query: string, approvedImpactAssessment: ChangeImpactAssessmentResult): Promise<RiskCriticalityStageResult>;
