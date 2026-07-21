import { config } from "../config.js";

const BATCH_SIZE = 32;

interface EmbeddingItem {
  embedding: number[];
}

interface EmbeddingResponse {
  data?: EmbeddingItem[];
}

// Calls Azure AI Foundry's v1 unified embeddings endpoint in a single batch.
async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!config.embeddings.apiKey) {
    throw new Error(
      "AZURE_OPENAI_API_KEY is not set - required for the embeddings API call.",
    );
  }

  if (!config.embeddings.endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT is not set in your .env");
  }

  // Azure AI Foundry v1 unified API shape:
  // https://<resource>.services.ai.azure.com/openai/v1/embeddings
  // The deployment/model name goes in the request body ("model"), not the URL.
  const base = config.embeddings.endpoint.replace(/\/$/, "");
  const url = config.embeddings.apiVersion
    ? `${base}/embeddings?api-version=${config.embeddings.apiVersion}`
    : `${base}/embeddings`;

  const body: Record<string, unknown> = {
    model: config.embeddings.deployment,
    input: texts,
  };
  // text-embedding-3-small defaults to 1536 dims; only send "dimensions"
  // if explicitly configured to request a smaller size.
  if (config.embeddings.dimensions) {
    body.dimensions = config.embeddings.dimensions;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": config.embeddings.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(`Embeddings API error ${response.status}: ${responseBody}`);
  }

  const data = (await response.json()) as EmbeddingResponse;

  if (!Array.isArray(data.data)) {
    throw new Error(
      `Unexpected embeddings API response shape: ${JSON.stringify(data).slice(0, 200)}`,
    );
  }

  return data.data.map((item) => item.embedding);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const batchVectors = await embedBatch(batch);
    vectors.push(...batchVectors);

    console.log(
      `Embedded ${Math.min(start + BATCH_SIZE, texts.length)}/${texts.length} chunks`,
    );
  }

  return vectors;
}
