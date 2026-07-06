import { callLLM } from "../llm/client.js";
import { RCA_PROMPT } from "../llm/prompts.js";
import {
  RCASchema,
  type RCAResult,
  type ClassificationResult,
  type ImpactAssessmentResult,
} from "../llm/schemas.js";
import { extractJson } from "../utils/jsonExtractor.js";

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
