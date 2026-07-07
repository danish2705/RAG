import { callLLM } from "../../llm/client.js";
import { CLASSIFICATION_PROMPT } from "../../llm/prompts/deviation.js";
import {
  ClassificationSchema,
  type ClassificationResult,
} from "../../llm/schemas/deviation.js";
import { extractJson } from "../../utils/jsonExtractor.js";

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
export async function runClassificationStage(
  query: string,
  contextText: string,
): Promise<ClassificationStageResult> {
  const userPrompt = `
Event Description:
${query}

Knowledge Base Context:
${contextText}
`.trim();

  const rawText = await callLLM(userPrompt, CLASSIFICATION_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = ClassificationSchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
