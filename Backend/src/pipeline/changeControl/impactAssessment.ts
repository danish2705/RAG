import { callLLM } from "../../llm/client.js";
import { CHANGE_IMPACT_ASSESSMENT_PROMPT } from "../../llm/prompts/changeControl.js";
import {
  ChangeImpactAssessmentSchema,
  type ChangeImpactAssessmentResult,
} from "../../llm/schemas/changeControl.js";
import { extractJson } from "../../utils/jsonExtractor.js";
import type { ClassificationResult } from "../../llm/schemas/deviation.js";

export interface ChangeImpactAssessmentStageResult {
  rawText: string;
  parsed: ChangeImpactAssessmentResult | null;
  error: Error | null;
}

/**
 * Stage 1 of 5 for the Change Control pipeline (change impact assessment →
 * risk & criticality → validation & testing strategy → implementation &
 * control actions → final summary). Runs only after a human has accepted
 * (or overridden) the upstream "Change Control" classification.
 */
export async function runChangeImpactAssessmentStage(
  query: string,
  contextText: string,
  approvedClassification: ClassificationResult,
): Promise<ChangeImpactAssessmentStageResult> {
  const userPrompt = `
Change Description:
${query}

Approved Classification (Stage 0, human-confirmed):
${JSON.stringify(approvedClassification, null, 2)}

Knowledge Base Context:
${contextText}
`.trim();

  const rawText = await callLLM(userPrompt, CHANGE_IMPACT_ASSESSMENT_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = ChangeImpactAssessmentSchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
