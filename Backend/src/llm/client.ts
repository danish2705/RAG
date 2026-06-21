import { config } from "../config.js";

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

/**
 * Calls the chat-completions endpoint (HF router, OpenAI-compatible).
 * Equivalent to call_llm() in the notebook.
 *
 * Note: the notebook called requests.post(..., verify=False), which disables
 * TLS certificate verification. That is intentionally NOT replicated here —
 * for a GxP system talking to an external API, certificate verification
 * should stay on. If you hit TLS errors, fix the root cause (CA bundle),
 * don't disable verification.
 */
export async function callLLM(userPrompt: string, systemPrompt: string): Promise<string> {
  if (!config.llm.apiKey) {
    throw new Error(
      "LLM_API_KEY is not set. Put it in your .env file (never hardcode it in source)."
    );
  }

  if (!config.llm.apiUrl){
    throw new Error("API_URL is not set in your .env")
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

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("LLM response did not contain choices[0].message.content");
  }

  return content;
}
