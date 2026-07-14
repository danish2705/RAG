import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

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

// chunking
export async function chunkText(
  text: string,
  size = 500,
  overlap = 50,
): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: size,
    chunkOverlap: overlap,
  });

  return splitter.splitText(text);
}

/** Equivalent to prepare_chunks(docs) in the notebook. */
export async function prepareChunks(docs: SourceDoc[]): Promise<DocChunk[]> {
  const allChunks: DocChunk[] = [];

  for (const doc of docs) {
    const textChunks = await chunkText(doc.content);
    for (const text of textChunks) {
      allChunks.push({ text, source: doc.source, type: doc.type });
    }
  }

  return allChunks;
}
