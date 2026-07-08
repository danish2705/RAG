import { type CAPAResult, type RCAResult, type ClassificationResult, type ImpactAssessmentResult } from "../../llm/schemas/deviation.js";
export interface CAPAStageResult {
    rawText: string;
    parsed: CAPAResult | null;
    error: Error | null;
}
/**
 * Stage 4 of 4. Only runs if Stage 3 (RCA) passed the gate.
 * Receives the FULL approved chain — classification (Stage 1), impact
 * assessment (Stage 2), and RCA findings (Stage 3) — so recommended actions
 * can be sized to severity and traced back to the specific root cause,
 * not generated from RCA findings in isolation.
 */
export declare function runCAPAStage(query: string, classification: ClassificationResult | null, impactAssessment: ImpactAssessmentResult | null, rca: RCAResult | null): Promise<CAPAStageResult>;
