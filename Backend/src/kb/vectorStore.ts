import { embedTexts } from "./embeddings.js";
import type { DocChunk } from "./chunker.js";

export interface VectorIndex {
  vectors: number[][];
  texts: string[];
  meta: DocChunk[];
}

export interface RetrievedChunk {
  text: string;
  meta: DocChunk;
}

/**
 * faiss.IndexFlatL2 is itself an exact brute-force L2 search (no
 * approximation), so a plain JS loop reproduces its behavior exactly without
 * needing a native FAISS binding in Node. Fine for knowledge bases up to a
 * few tens of thousands of chunks; swap in a real vector DB if you outgrow that.
 */
function squaredL2(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return sum;
}

/** Equivalent to build_index(chunks) in the notebook. */
export async function buildIndex(chunks: DocChunk[]): Promise<VectorIndex> {
  const texts = chunks
    .map((c) => c.text)
    .filter((t) => t && t.trim().length > 0);

  if (texts.length === 0) {
    throw new Error("No valid text found in chunks!");
  }

  const vectors = await embedTexts(texts);

  return { vectors, texts, meta: chunks };
}

/** Equivalent to retrieve(query, index, texts, meta, top_k) in the notebook. */
export async function retrieve(
  query: string,
  index: VectorIndex,
  topK = 3,
): Promise<RetrievedChunk[]> {
  const [queryVector] = await embedTexts([query]);

  const scored = index.vectors.map((vector, i) => ({
    distance: squaredL2(queryVector, vector),
    text: index.texts[i],
    meta: index.meta[i],
  }));

  scored.sort((a, b) => a.distance - b.distance);

  return scored.slice(0, topK).map(({ text, meta }) => ({ text, meta }));
}
