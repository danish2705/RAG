import { callLLM } from "../llm/client.js";
import { RCA_PROMPT } from "../llm/prompts.js";
import { RCASchema, type RCAResult, type ClassificationResult } from "../llm/schemas.js";
import { extractJson } from "../utils/jsonExtractor.js";

export interface RCAStageResult {
  rawText: string;
  parsed: RCAResult | null;
  error: Error | null;
}

/**
 * Stage 2 of 3. Only runs if Stage 1 (classification) passed the gate.
 * Receives the classification output as additional context so RCA isn't
 * reasoning from scratch.
 */
export async function runRCAStage(
  query: string,
  contextText: string,
  classification: ClassificationResult | null
): Promise<RCAStageResult> {
  const userPrompt = `
Event Description:
${query}

Classification (from previous stage):
${JSON.stringify(classification, null, 2)}

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
