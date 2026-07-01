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

// Explicit allowlist mapping source -> table name. Table names can't be
// parameterized with pg placeholders, so we never interpolate `source`
// directly into SQL — only this pre-validated constant ever goes in.
const TABLE_BY_SOURCE: Record<string, string> = {
  deviation: "deviation_chunks",
  change_control: "change_control_chunks",
};

function tableFor(source: string): string {
  const table = TABLE_BY_SOURCE[source];
  if (!table) {
    throw new Error(
      `Unknown source "${source}" - no chunks table mapped for it. ` +
        `Known sources: ${Object.keys(TABLE_BY_SOURCE).join(", ")}`,
    );
  }
  return table;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function toSqlVector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

interface PendingRow {
  docKey: string;
  chunkIndex: number;
  hash: string;
  text: string;
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
export async function buildIndex(chunks: DocChunk[]): Promise<VectorIndex> {
  if (chunks.length === 0) {
    throw new Error("No valid text found in chunks!");
  }

  const source = chunks[0].type; // 'deviation' | 'change_control'
  const table = tableFor(source);

  // group chunks by doc_key (= S3 key / file path), preserving order so we
  // can assign a stable chunk_index per document.
  const byDoc = new Map<string, DocChunk[]>();
  for (const c of chunks) {
    const arr = byDoc.get(c.source) ?? [];
    arr.push(c);
    byDoc.set(c.source, arr);
  }

  // 1) Fetch all existing hashes for this source's table in one query.
  const existingResult = await pool.query(
    `SELECT doc_key, chunk_index, content_hash FROM ${table}`,
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

      pending.push({ docKey, chunkIndex: i, hash, text: chunk.text });
    }
  }

  // 3) Batch-embed everything that's new or changed in one call.
  if (pending.length > 0) {
    const vectors = await embedTexts(pending.map((p) => p.text));

    // 4) Single multi-row upsert instead of one INSERT per chunk.
    const valuesSql: string[] = [];
    const params: unknown[] = [];
    pending.forEach((row, idx) => {
      const base = idx * 5;
      valuesSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`,
      );
      params.push(
        row.docKey,
        row.chunkIndex,
        row.hash,
        row.text,
        toSqlVector(vectors[idx]),
      );
    });

    await pool.query(
      `INSERT INTO ${table} (doc_key, chunk_index, content_hash, text, embedding)
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
      `DELETE FROM ${table}
       WHERE (doc_key, chunk_index) IN (
         SELECT * FROM UNNEST($1::text[], $2::int[])
       )`,
      [staleDocKeys, staleIndexes],
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
  const table = tableFor(index.source);
  const [queryVector] = await embedTexts([query]);

  const result = await pool.query(
    `SELECT text, doc_key
     FROM ${table}
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [toSqlVector(queryVector), topK],
  );

  return result.rows.map((row) => ({
    text: row.text,
    meta: {
      text: row.text,
      source: row.doc_key,
      type: index.source,
    } as DocChunk,
  }));
}
