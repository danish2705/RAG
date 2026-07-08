export function extractJson(rawText) {
    if (typeof rawText !== "string" || rawText.trim().length === 0) {
        throw new Error("Empty response from LLM");
    }
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error("No JSON object found in LLM response");
    }
    try {
        return JSON.parse(match[0]);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse JSON from LLM response: ${message}`);
    }
}
//# sourceMappingURL=jsonExtractor.js.map