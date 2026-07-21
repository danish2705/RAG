import { config } from "../config.js";

interface ChatCompletionChoice {
  message?: {
    content?: string;
  };
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

export async function callLLM(
  userPrompt: string,
  systemPrompt: string,
): Promise<string> {
  if (!config.llm.apiKey) {
    throw new Error(
      "AZURE_OPENAI_API_KEY is not set. Put it in your .env file.",
    );
  }

  if (!config.llm.endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT is not set in your .env");
  }

  // Azure AI Foundry v1 unified API shape:
  // https://<resource>.services.ai.azure.com/openai/v1/chat/completions
  // The deployment/model name goes in the request body ("model"), not the URL.
  const base = config.llm.endpoint.replace(/\/$/, "");
  const url = config.llm.apiVersion
    ? `${base}/chat/completions?api-version=${config.llm.apiVersion}`
    : `${base}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": config.llm.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.llm.deployment,
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
