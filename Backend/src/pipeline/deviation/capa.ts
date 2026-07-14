import { callLLM } from "../../llm/client.js";
import { CAPA_PROMPT } from "../../llm/prompts/deviation.js";
import {
  CAPASchema,
  type CAPAResult,
  type RCAResult,
  type ClassificationResult,
  type ImpactAssessmentResult,
} from "../../llm/schemas/deviation.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface CAPAStageResult {
  rawText: string;
  parsed: CAPAResult | null;
  error: Error | null;
}

// Stage 4 of 4. Only runs if Stage 3 (RCA) passed the gate.
export async function runCAPAStage(
  query: string,
  classification: ClassificationResult | null,
  impactAssessment: ImpactAssessmentResult | null,
  rca: RCAResult | null,
): Promise<CAPAStageResult> {
  const userPrompt = `
Event Description:
${query}

Approved Classification (from Stage 1, confirmed by human reviewer):
${JSON.stringify(classification, null, 2)}

Approved Impact Assessment (from Stage 2, confirmed by human reviewer):
${JSON.stringify(impactAssessment, null, 2)}

RCA Findings (from Stage 3, confirmed by human reviewer):
${JSON.stringify(rca, null, 2)}
`.trim();

  const rawText = await callLLM(userPrompt, CAPA_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = CAPASchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
