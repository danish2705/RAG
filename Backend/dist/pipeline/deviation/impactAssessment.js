import { callLLM } from "../llm/client.js";
import { IMPACT_ASSESSMENT_PROMPT } from "../llm/prompts/deviation.js";
import { ImpactAssessmentSchema, } from "../llm/schemas/deviation.js";
import { extractJson } from "../utils/jsonExtractor.js";
/**
 * Stage 2 of 4. Only runs after a human has accepted or overridden the
 * Stage 1 classification (frontend: AIRecommendation page → Accept/Override
 * button). Receives the approved classification as context so severity is
 * rated against a routing decision a human has already signed off on —
 * it never re-runs or second-guesses the classification itself.
 */
export async function runImpactAssessmentStage(query, contextText, classification) {
    const userPrompt = `
Event Description:
${query}

Approved Classification (from previous stage, confirmed by human reviewer):
${JSON.stringify(classification, null, 2)}

Knowledge Base Context:
${contextText}
`.trim();
    const rawText = await callLLM(userPrompt, IMPACT_ASSESSMENT_PROMPT);
    try {
        const json = extractJson(rawText);
        const parsed = ImpactAssessmentSchema.parse(json);
        return { rawText, parsed, error: null };
    }
    catch (error) {
        return { rawText, parsed: null, error: error };
    }
}
//# sourceMappingURL=impactAssessment.js.map