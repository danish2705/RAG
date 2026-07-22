import { pool } from "../db.js";
import { parseMetadata } from "./parseMetadata.js";

const BATCH_SIZE = 200;

async function backfillTable(table: "deviation_cases" | "change_control_cases") {
  let offset = 0;
  let totalUpdated = 0;

  for (;;) {
    const { rows } = await pool.query(
      `SELECT id, query
       FROM ${table}
       WHERE metadata = '{}'::jsonb
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset],
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const metadata = parseMetadata(row.query);
      if (Object.keys(metadata).length === 0) continue;

      await pool.query(`UPDATE ${table} SET metadata = $1 WHERE id = $2`, [
        JSON.stringify(metadata),
        row.id,
      ]);
      totalUpdated++;
    }

    console.log(`[${table}] processed ${offset + rows.length} rows so far...`);
    offset += BATCH_SIZE;
  }

  console.log(`[${table}] done. ${totalUpdated} rows updated with metadata.`);
}

async function main() {
  await backfillTable("deviation_cases");
  await backfillTable("change_control_cases");
  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});