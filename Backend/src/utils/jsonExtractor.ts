/**
 * Extracts and parses the first {...} JSON object out of raw LLM text.
 *
 * The notebook's classify_query() did this with a regex + bare except that
 * silently fell back to {"type": "deviation"} on any failure — meaning a
 * malformed or empty LLM response was invisibly treated as a successful
 * classification. Here we throw instead, so the caller (and the gate) can
 * see the failure and route the case to a human rather than guessing.
 */
export function extractJson(rawText: string): unknown {
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error("Empty response from LLM");
  }

  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON object found in LLM response");
  }

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse JSON from LLM response: ${message}`);
  }
}
