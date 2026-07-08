import { config } from "../config.js";
export async function callLLM(userPrompt, systemPrompt) {
    if (!config.llm.apiKey) {
        throw new Error("LLM_API_KEY is not set. Put it in your .env file.");
    }
    if (!config.llm.apiUrl) {
        throw new Error("API_URL is not set in your .env");
    }
    const response = await fetch(config.llm.apiUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.llm.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: config.llm.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
        }),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`LLM API error ${response.status}: ${body}`);
    }
    const data = (await response.json());
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("LLM response did not contain choices[0].message.content");
    }
    return content;
}
//# sourceMappingURL=client.js.map