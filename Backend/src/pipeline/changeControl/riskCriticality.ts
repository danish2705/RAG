import { callLLM } from "../../llm/client.js";
import { RISK_CRITICALITY_PROMPT } from "../../llm/prompts/changeControl.js";
import {
  RiskCriticalitySchema,
  type RiskCriticalityResult,
  type ChangeImpactAssessmentResult,
} from "../../llm/schemas/changeControl.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface RiskCriticalityStageResult {
  rawText: string;
  parsed: RiskCriticalityResult | null;
  error: Error | null;
}

/**
 * Stage 2 of 5: risk & criticality evaluation. Runs only after a human has
 * accepted/overridden the Stage 1 Change Impact Assessment.
 */
export async function runRiskCriticalityStage(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
): Promise<RiskCriticalityStageResult> {
  const userPrompt = `
Change Description:
${query}

Approved Change Impact Assessment (Stage 1, human-confirmed):
${JSON.stringify(approvedImpactAssessment, null, 2)}
`.trim();

  const rawText = await callLLM(userPrompt, RISK_CRITICALITY_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = RiskCriticalitySchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
