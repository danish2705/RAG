import { callLLM } from "../llm/client.js";
import { CAPA_PROMPT } from "../llm/prompts.js";
import { CAPASchema, type CAPAResult, type RCAResult } from "../llm/schemas.js";
import { extractJson } from "../utils/jsonExtractor.js";

export interface CAPAStageResult {
  rawText: string;
  parsed: CAPAResult | null;
  error: Error | null;
}

/**
 * Stage 3 of 3. Only runsf Stage 2 (RCA) passed the gate.
 * Receives the RCA output as additional context.
 */
export async function runCAPAStage(
  query: string,
  rca: RCAResult | null
): Promise<CAPAStageResult> {
  const userPrompt = `
Event Description:
${query}

RCA Findings (from previous stage):
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
