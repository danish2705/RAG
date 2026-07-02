import { config } from "../config.js";

// Batch size per HF API call. Keeps request payloads reasonable and avoids
// hitting any single-request size/time limits on the provider side.
const BATCH_SIZE = 32;

/**
 * Calls Hugging Face's router feature-extraction endpoint to embed a batch
 * of texts in one HTTP request. Replaces the local @xenova/transformers
 * model - no ONNX runtime, no local CPU inference, nothing to download.
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!config.embeddings.apiKey) {
    throw new Error(
      "API_KEY is not set - required for the embeddings API call (reuses the same HF token as the LLM).",
    );
  }

  const response = await fetch(config.embeddings.apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.embeddings.apiKey}`,
      "Content-Type": "application/json",
    },
    // { inputs: [...] } with pooling handled by the underlying model
    // (sentence-transformers models already return one pooled vector per input).
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Embeddings API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as unknown;

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error(
      `Unexpected embeddings API response shape: ${JSON.stringify(data).slice(0, 200)}`,
    );
  }

  return data as number[][];
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
