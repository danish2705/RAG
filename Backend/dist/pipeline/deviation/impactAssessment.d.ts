import { type ImpactAssessmentResult, type ClassificationResult } from "../llm/schemas/deviation.js";
export interface ImpactAssessmentStageResult {
    rawText: string;
    parsed: ImpactAssessmentResult | null;
    error: Error | null;
}
/**
 * Stage 2 of 4. Only runs after a human has accepted or overridden the
 * Stage 1 classification (frontend: AIRecommendation page → Accept/Override
 * button). Receives the approved classification as context so severity is
 * rated against a routing decision a human has already signed off on —
 * it never re-runs or second-guesses the classification itself.
 */
export declare function runImpactAssessmentStage(query: string, contextText: string, classification: ClassificationResult | null): Promise<ImpactAssessmentStageResult>;
