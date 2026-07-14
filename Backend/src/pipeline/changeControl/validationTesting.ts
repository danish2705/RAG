import { callLLM } from "../../llm/client.js";
import { VALIDATION_TESTING_PROMPT } from "../../llm/prompts/changeControl.js";
import {
  ValidationTestingSchema,
  type ValidationTestingResult,
  type ChangeImpactAssessmentResult,
  type RiskCriticalityResult,
} from "../../llm/schemas/changeControl.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface ValidationTestingStageResult {
  rawText: string;
  parsed: ValidationTestingResult | null;
  error: Error | null;
}


// Stage 3 : validation & testing strategy.
export async function runValidationTestingStage(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
): Promise<ValidationTestingStageResult> {
  const userPrompt = `
Change Description:
${query}

Approved Change Impact Assessment (Stage 1, human-confirmed):
${JSON.stringify(approvedImpactAssessment, null, 2)}

Approved Risk & Criticality Evaluation (Stage 2, human-confirmed):
${JSON.stringify(approvedRiskCriticality, null, 2)}
`.trim();

  const rawText = await callLLM(userPrompt, VALIDATION_TESTING_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = ValidationTestingSchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
