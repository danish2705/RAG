import { type ClassificationResult } from "../../llm/schemas/deviation.js";
export interface ClassificationStageResult {
    rawText: string;
    parsed: ClassificationResult | null;
    error: Error | null;
}
/**
 * Stage 1 of 4 (classification → impact assessment → RCA → CAPA).
 * Routing decision ONLY (Deviation / Change Control / Hybrid) — no
 * severity/impact rating happens here. A human must accept or override
 * this classification (frontend: AIRecommendation page) before
 * runImpactAssessmentStage() is ever called.
 *
 * Returns { rawText, parsed, error }:
 *  - parsed is set (and error is null) only if the output was valid JSON
 *    AND passed ClassificationSchema validation.
 */
export declare function runClassificationStage(query: string, contextText: string): Promise<ClassificationStageResult>;
