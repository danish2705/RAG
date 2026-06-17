import { callLLM } from "../llm/client.js";
import { CLASSIFICATION_PROMPT } from "../llm/prompts.js";
import { ClassificationSchema, type ClassificationResult } from "../llm/schemas.js";
import { extractJson } from "../utils/jsonExtractor.js";

export interface ClassificationStageResult {
  rawText: string;
  parsed: ClassificationResult | null;
  error: Error | null;
}

/**
 * Stage 1 of 3. Equivalent to the classification portion of the notebook's
 * single generate_answer() call, now isolated into its own LLM round trip.
 *
 * Returns { rawText, parsed, error }:
 *  - parsed is set (and error is null) only if the output was valid JSON
 *    AND passed ClassificationSchema validation.
 */
export async function runClassificationStage(
  query: string,
  contextText: string
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
