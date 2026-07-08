import type { DocChunk } from "./chunker.js";
export interface RetrievedChunk {
    text: string;
    meta: DocChunk;
}
export interface VectorIndex {
    source: string;
}
/**
 * Syncs a set of chunks for one source ('deviation' | 'change_control')
 * into its own dedicated table (deviation_chunks / change_control_chunks).
 *
 * Because each source now has its own table, doc_key + chunk_index is a
 * genuinely unique key within that table - no more risk of one source's
 * upsert silently overwriting another source's row.
 *
 * 1) fetches all existing hashes for the source's table in a single query,
 * 2) compares in memory using a Map (no per-chunk DB round-trip),
 * 3) embeds every changed/new chunk in one batched embedTexts() call,
 * 4) writes all changed/new rows in a single multi-row upsert,
 * 5) deletes stale rows (no longer present in source docs) in one query.
 */
export declare function buildIndex(chunks: DocChunk[]): Promise<VectorIndex>;
/** Cosine-similarity retrieval via pgvector's <=> operator. */
export declare function retrieve(query: string, index: VectorIndex, topK?: number): Promise<RetrievedChunk[]>;
