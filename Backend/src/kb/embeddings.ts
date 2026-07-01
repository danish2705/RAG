import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { config } from "../config.js";
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

// Lazily loads the model once (same model as the notebook's)
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
const BATCH_SIZE = 16;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const output = await extractor(batch, { pooling: "mean", normalize: true });

    // With a batch input, output.dims = [batchSize, embeddingDim].
    // output.tolist() gives back one array of numbers per input text.
    const batchVectors = output.tolist() as number[][];
    vectors.push(...batchVectors);

    console.log(
      `Embedded ${Math.min(start + BATCH_SIZE, texts.length)}/${texts.length} chunks`,
    );
  }

  return vectors;
}
