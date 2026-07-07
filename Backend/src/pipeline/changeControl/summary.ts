import { callLLM } from "../../llm/client.js";
import { FINAL_CHANGE_CONTROL_SUMMARY_PROMPT } from "../../llm/prompts/changeControl.js";
import {
  FinalChangeControlSummarySchema,
  type FinalChangeControlSummaryResult,
  type ChangeImpactAssessmentResult,
  type RiskCriticalityResult,
  type ValidationTestingResult,
  type ImplementationControlResult,
} from "../../llm/schemas/changeControl.js";
import { extractJson } from "../../utils/jsonExtractor.js";

export interface FinalSummaryStageResult {
  rawText: string;
  parsed: FinalChangeControlSummaryResult | null;
  error: Error | null;
}

/**
 * Stage 5 of 5: final change control summary. Runs only after a human has
 * accepted/overridden Stage 4 (Implementation & Control Actions). Advisory
 * only — never auto-approves/rejects the change.
 */
export async function runFinalSummaryStage(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
  approvedValidationTesting: ValidationTestingResult,
  approvedImplementationControl: ImplementationControlResult,
): Promise<FinalSummaryStageResult> {
  const userPrompt = `
Change Description:
${query}

Approved Change Impact Assessment (Stage 1, human-confirmed):
${JSON.stringify(approvedImpactAssessment, null, 2)}

Approved Risk & Criticality Evaluation (Stage 2, human-confirmed):
${JSON.stringify(approvedRiskCriticality, null, 2)}

Approved Validation & Testing Strategy (Stage 3, human-confirmed):
${JSON.stringify(approvedValidationTesting, null, 2)}

Approved Implementation & Control Actions (Stage 4, human-confirmed):
${JSON.stringify(approvedImplementationControl, null, 2)}
`.trim();

  const rawText = await callLLM(
    userPrompt,
    FINAL_CHANGE_CONTROL_SUMMARY_PROMPT,
  );

  try {
    const json = extractJson(rawText);
    const parsed = FinalChangeControlSummarySchema.parse(json);
    return { rawText, parsed, error: null };
  } catch (error) {
    return { rawText, parsed: null, error: error as Error };
  }
}
