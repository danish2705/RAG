import { callLLM } from "../llm/client.js";
import { extractJson } from "../utils/jsonExtractor.js";

export type QueryType = "deviation" | "change_control" | "hybrid";

export interface QueryRouting {
  type: QueryType | string;
  confidence: string;
  reason: string;
}

const ROUTER_SYSTEM_PROMPT = `
You are a routing assistant. Decide which knowledge base(s) a query needs.
Return JSON only.
`.trim();

/** Equivalent to classify_query(query) in the notebook, minus the silent fallback. */
export async function classifyQueryType(query: string): Promise<QueryRouting> {
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
    return extractJson(response) as QueryRouting;
  } catch {
    //forged data to by pass the error
    return {
      type: "hybrid",
      confidence: "low",
      reason: "routing_parse_failed",
    };
  }
}

export function routeToSources(
  queryType: string,
): Array<"deviation" | "change_control"> {
  if (queryType === "deviation") return ["deviation"];
  if (queryType === "change_control") return ["change_control"];
  return ["deviation", "change_control"];
}
