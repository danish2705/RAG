import { callLLM } from "../../llm/client.js";
import { IMPLEMENTATION_CONTROL_PROMPT } from "../../llm/prompts/changeControl.js";
import {
  ImplementationControlSchema,
  type ImplementationControlResult,
  type ChangeImpactAssessmentResult,
  type RiskCriticalityResult,
  type ValidationTestingResult,
} from "../../llm/schemas/changeControl.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface ImplementationControlStageResult {
  rawText: string;
  parsed: ImplementationControlResult | null;
  error: Error | null;
}


// Stage 4 of 5: implementation & control actions. Runs only after a human
export async function runImplementationControlStage(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
  approvedValidationTesting: ValidationTestingResult,
): Promise<ImplementationControlStageResult> {
  const userPrompt = `
Change Description:
${query}

Approved Change Impact Assessment (Stage 1, human-confirmed):
${JSON.stringify(approvedImpactAssessment, null, 2)}

Approved Risk & Criticality Evaluation (Stage 2, human-confirmed):
${JSON.stringify(approvedRiskCriticality, null, 2)}

Approved Validation & Testing Strategy (Stage 3, human-confirmed):
${JSON.stringify(approvedValidationTesting, null, 2)}
`.trim();

  const rawText = await callLLM(userPrompt, IMPLEMENTATION_CONTROL_PROMPT);

  try {
    const json = extractJson(rawText);
    const parsed = ImplementationControlSchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
