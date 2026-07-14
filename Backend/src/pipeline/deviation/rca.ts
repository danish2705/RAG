import { callLLM } from "../../llm/client.js";
import { RCA_PROMPT } from "../../llm/prompts/deviation.js";
import {
  RCASchema,
  type RCAResult,
  type ClassificationResult,
  type ImpactAssessmentResult,
} from "../../llm/schemas/deviation.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface RCAStageResult {
  rawText: string;
  parsed: RCAResult | null;
  error: Error | null;
}


// Stage 3 . Only runs if Stage 2 (impact assessment) passed the gate.
export async function runRCAStage(
  query: string,
  contextText: string,
  classification: ClassificationResult | null,
  impactAssessment: ImpactAssessmentResult | null,
): Promise<RCAStageResult> {
  const userPrompt = `
Event Description:
${query}

Approved Classification (from Stage 1, confirmed by human reviewer):
${JSON.stringify(classification, null, 2)}

Approved Impact Assessment (from Stage 2, confirmed by human reviewer):
${JSON.stringify(impactAssessment, null, 2)}

Knowledge Base Context:
${contextText}
`.trim();

  const rawText = await callLLM(userPrompt, RCA_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = RCASchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
