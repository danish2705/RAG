import { type ChangeImpactAssessmentResult } from "../../llm/schemas/changeControl.js";
import type { ClassificationResult } from "../../llm/schemas/deviation.js";
export interface ChangeImpactAssessmentStageResult {
    rawText: string;
    parsed: ChangeImpactAssessmentResult | null;
    error: Error | null;
}
/**
 * Stage 1 of 5 for the Change Control pipeline (change impact assessment →
 * risk & criticality → validation & testing strategy → implementation &
 * control actions → final summary). Runs only after a human has accepted
 * (or overridden) the upstream "Change Control" classification.
 */
export declare function runChangeImpactAssessmentStage(query: string, contextText: string, approvedClassification: ClassificationResult): Promise<ChangeImpactAssessmentStageResult>;
