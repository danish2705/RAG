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
  /**
   * Set when the LLM determined the submission itself is too vague,
   * contradictory, or off-topic to classify (STEP 1 of the prompt). This is
   * a valid, expected outcome — NOT a parsing/system error — so it is kept
   * separate from `error` and must be checked before treating a null
   * `parsed` as a failure.
   */
  insufficientInput: InsufficientInputResult | null;
  error: Error | null;
}

/**
 * Stage 1 of 4 (classification → impact assessment → RCA → CAPA).
 * Routing decision ONLY (Deviation / Change Control) — no
 * severity/impact rating happens here. A human must accept or override
 * this classification (frontend: AIRecommendation page) before
 * runImpactAssessmentStage() is ever called.
 *
 * Returns { rawText, parsed, insufficientInput, error }:
 *  - parsed is set only if the output was valid JSON AND passed
 *    ClassificationSchema validation.
 *  - insufficientInput is set only if the output was valid JSON AND matched
 *    the { insufficient_input: true, reason } shape instead.
 *  - error is set only for a genuine parse/validation failure — neither of
 *    the two valid shapes above matched.
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
