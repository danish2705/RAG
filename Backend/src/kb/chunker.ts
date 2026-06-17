export interface SourceDoc {
  content: string;
  source: string;
  type: string;
}

export interface DocChunk {
  text: string;
  source: string;
  type: string;
}

/** Equivalent to chunk_text(text, size, overlap) in the notebook. */
export function chunkText(text: string, size = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  const step = size - overlap;

  for (let i = 0; i < text.length; i += step) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

/** Equivalent to prepare_chunks(docs) in the notebook. */
export function prepareChunks(docs: SourceDoc[]): DocChunk[] {
  const allChunks: DocChunk[] = [];

  for (const doc of docs) {
    for (const text of chunkText(doc.content)) {
      allChunks.push({ text, source: doc.source, type: doc.type });
    }
  }

  return allChunks;
}
