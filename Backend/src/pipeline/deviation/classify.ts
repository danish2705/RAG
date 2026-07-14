import { callLLM } from "../../llm/client.js";
import { CLASSIFICATION_PROMPT } from "../../llm/prompts/deviation.js";
import {
  ClassificationSchema,
  InsufficientInputSchema,
  type ClassificationResult,
  type InsufficientInputResult,
} from "../../llm/schemas/deviation.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface ClassificationStageResult {
  rawText: string;
  parsed: ClassificationResult | null;
  insufficientInput: InsufficientInputResult | null;
  error: Error | null;
}

// Stage 1  (classification → impact assessment → RCA → CAPA).
// Routing decision ONLY (Deviation / Change Control) — no
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

    // Check the "insufficient input" shape FIRST — it's a distinct, valid
    // response, not a fallback or an error condition.
    const insufficientCheck = InsufficientInputSchema.safeParse(json);
    if (insufficientCheck.success) {
      return {
        rawText,
        parsed: null,
        insufficientInput: insufficientCheck.data,
        error: null,
      };
    }

    const parsed = ClassificationSchema.parse(json);
    return { rawText, parsed, insufficientInput: null, error: null };
  } catch (error) {
    return {
      rawText,
      parsed: null,
      insufficientInput: null,
      error: error as Error,
    };
  }
}
