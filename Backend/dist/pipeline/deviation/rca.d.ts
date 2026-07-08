import { type RCAResult, type ClassificationResult, type ImpactAssessmentResult } from "../../llm/schemas/deviation.js";
export interface RCAStageResult {
    rawText: string;
    parsed: RCAResult | null;
    error: Error | null;
}
/**
 * Stage 3 of 4. Only runs if Stage 2 (impact assessment) passed the gate.
 * Receives BOTH the approved classification (Stage 1) and the approved
 * impact assessment (Stage 2) as context — RCA needs to know what kind of
 * event this is AND how severe it was rated, so investigation depth and
 * evidence requirements scale with severity instead of reasoning from
 * classification alone.
 */
export declare function runRCAStage(query: string, contextText: string, classification: ClassificationResult | null, impactAssessment: ImpactAssessmentResult | null): Promise<RCAStageResult>;
