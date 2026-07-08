import { config } from "../config.js";
const BATCH_SIZE = 32;
// Calls Hugging Face's router API for embeddings (sentence-transformers models) in a single batch.
async function embedBatch(texts) {
    if (!config.embeddings.apiKey) {
        throw new Error("API_KEY is not set - required for the embeddings API call (reuses the same HF token as the LLM).");
    }
    const response = await fetch(config.embeddings.apiUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.embeddings.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Embeddings API error ${response.status}: ${body}`);
    }
    const data = (await response.json());
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
        throw new Error(`Unexpected embeddings API response shape: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return data;
}
export async function embedTexts(texts) {
    const vectors = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
        const batch = texts.slice(start, start + BATCH_SIZE);
        const batchVectors = await embedBatch(batch);
        vectors.push(...batchVectors);
        console.log(`Embedded ${Math.min(start + BATCH_SIZE, texts.length)}/${texts.length} chunks`);
    }
    return vectors;
}
//# sourceMappingURL=embeddings.js.map