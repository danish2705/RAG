import { createHash } from "node:crypto";
import { pool } from "../db.js";
import { embedTexts } from "./embeddings.js";
import type { DocChunk } from "./chunker.js";

export interface RetrievedChunk {
  text: string;
  meta: DocChunk;
}

// Marker that a source has been synced to Postgres; real data lives in the DB.
export interface VectorIndex {
  source: string;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toSqlVector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

interface PendingRow {
  source: string;
  docKey: string;
  chunkIndex: number;
  hash: string;
  text: string;
}

/**
 * Syncs a set of chunks for one source ('deviation' | 'change_control')
 * into Postgres.
 *
 * Optimized version: instead of one SELECT + one INSERT per chunk, this
 * 1) fetches all existing hashes for the source in a single query,
 * 2) compares in memory using a Set/Map (no per-chunk DB round-trip),
 * 3) embeds every changed/new chunk in one batched embedTexts() call,
 * 4) writes all changed/new rows in a single multi-row upsert,
 * 5) deletes stale rows (no longer present in source docs) in one query.
 */
export async function buildIndex(chunks: DocChunk[]): Promise<VectorIndex> {
  if (chunks.length === 0) {
    throw new Error("No valid text found in chunks!");
  }

  const source = chunks[0].type; // 'deviation' | 'change_control'

  // group chunks by doc_key (= S3 key / file path), preserving order so we
  // can assign a stable chunk_index per document.
  const byDoc = new Map<string, DocChunk[]>();
  for (const c of chunks) {
    const arr = byDoc.get(c.source) ?? [];
    arr.push(c);
    byDoc.set(c.source, arr);
  }

  // 1) Fetch all existing hashes for this source in one query.
  const existingResult = await pool.query(
    `SELECT doc_key, chunk_index, content_hash FROM chunks WHERE source = $1`,
    [source],
  );
  const existingHashes = new Map<string, string>(); // "docKey::index" -> hash
  for (const row of existingResult.rows) {
    existingHashes.set(`${row.doc_key}::${row.chunk_index}`, row.content_hash);
  }

  // 2) Compare in memory; collect only what actually needs embedding.
  const seenKeys = new Set<string>();
  const pending: PendingRow[] = [];

  for (const [docKey, docChunks] of byDoc) {
    for (let i = 0; i < docChunks.length; i++) {
      const chunk = docChunks[i];
      const key = `${docKey}::${i}`;
      const hash = hashText(chunk.text);
      seenKeys.add(key);

      if (existingHashes.get(key) === hash) {
        continue; // unchanged, skip
      }

      pending.push({ source, docKey, chunkIndex: i, hash, text: chunk.text });
    }
  }

  // 3) Batch-embed everything that's new or changed in one call.
  if (pending.length > 0) {
    const vectors = await embedTexts(pending.map((p) => p.text));

    // 4) Single multi-row upsert instead of one INSERT per chunk.
    const valuesSql: string[] = [];
    const params: unknown[] = [];
    pending.forEach((row, idx) => {
      const base = idx * 6;
      valuesSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`,
      );
      params.push(
        row.source,
        row.docKey,
        row.chunkIndex,
        row.hash,
        row.text,
        toSqlVector(vectors[idx]),
      );
    });

    await pool.query(
      `INSERT INTO chunks (source, doc_key, chunk_index, content_hash, text, embedding)
       VALUES ${valuesSql.join(", ")}
       ON CONFLICT (doc_key, chunk_index)
       DO UPDATE SET content_hash = EXCLUDED.content_hash,
                      text = EXCLUDED.text,
                      embedding = EXCLUDED.embedding,
                      created_at = now()`,
      params,
    );
  }

  // 5) Delete rows that no longer correspond to any current chunk for this source.
  const staleKeys = [...existingHashes.keys()].filter((k) => !seenKeys.has(k));
  if (staleKeys.length > 0) {
    const staleDocKeys = staleKeys.map((k) => k.split("::")[0]);
    const staleIndexes = staleKeys.map((k) => Number(k.split("::")[1]));

    await pool.query(
      `DELETE FROM chunks
       WHERE source = $1
         AND (doc_key, chunk_index) IN (
           SELECT * FROM UNNEST($2::text[], $3::int[])
         )`,
      [source, staleDocKeys, staleIndexes],
    );
  }

  return { source };
}

/** Cosine-similarity retrieval via pgvector's <=> operator. */
export async function retrieve(
  query: string,
  index: VectorIndex,
  topK = 3,
): Promise<RetrievedChunk[]> {
  const [queryVector] = await embedTexts([query]);

  const result = await pool.query(
    `SELECT text, source, doc_key
     FROM chunks
     WHERE source = $1
     ORDER BY embedding <=> $2
     LIMIT $3`,
    [index.source, toSqlVector(queryVector), topK],
  );

  return result.rows.map((row) => ({
    text: row.text,
    meta: { text: row.text, source: row.doc_key, type: row.source } as DocChunk,
  }));
}
