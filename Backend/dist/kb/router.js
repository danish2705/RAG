import { callLLM } from "../llm/client.js";
import { extractJson } from "../utils/jsonExtractor.js";
const ROUTER_SYSTEM_PROMPT = `
You are a routing assistant. Decide which knowledge base(s) a query needs.
Return JSON only.
`.trim();
/** Equivalent to classify_query(query) in the notebook, minus the silent fallback. */
export async function classifyQueryType(query) {
    const prompt = `
Classify into:
- deviation
- change_control
- hybrid

Return JSON:
{
  "type": "",
  "confidence": "",
  "reason": ""
}

Query: ${query}
`.trim();
    const response = await callLLM(prompt, ROUTER_SYSTEM_PROMPT);
    try {
        return extractJson(response);
    }
    catch {
        //forged data to by pass the error
        return {
            type: "hybrid",
            confidence: "low",
            reason: "routing_parse_failed",
        };
    }
}
export function routeToSources(queryType) {
    if (queryType === "deviation")
        return ["deviation"];
    if (queryType === "change_control")
        return ["change_control"];
    return ["deviation", "change_control"];
}
//# sourceMappingURL=router.js.map