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
export declare function chunkText(text: string, size?: number, overlap?: number): string[];
/** Equivalent to prepare_chunks(docs) in the notebook. */
export declare function prepareChunks(docs: SourceDoc[]): DocChunk[];
