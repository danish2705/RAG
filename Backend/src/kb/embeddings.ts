import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { config } from "../config.js";

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

// Lazily loads the model once (same model as the notebook's
// SentenceTransformer('all-MiniLM-L6-v2')) and reuses it for every call.
function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", config.embeddings.model);
  }
  return extractorPromise;
}

/**
 * Equivalent to model.encode(texts) in the notebook.
 * Returns an array of plain-number arrays (one embedding vector per input string).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const vectors: number[][] = [];

  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(output.data as ArrayLike<number>));
  }

  return vectors;
}
