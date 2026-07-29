import { Pool } from "pg";
import { config } from "./config.js";

export const pool = new Pool({
  connectionString: config.databaseUrl.url,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

// ---------------------------------------------------------------------------
// Lightweight startup migrations. There's no migration framework in this
// project — the tables are created out-of-band — so this just brings the
// approval workflow columns up to date on every boot. All statements are
// idempotent (IF NOT EXISTS), so this is safe to run every time.
// ---------------------------------------------------------------------------
const APPROVAL_WORKFLOW_COLUMNS = `
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_by TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ
`;

export async function runMigrations(): Promise<void> {
  await pool.query(`ALTER TABLE deviation_cases ${APPROVAL_WORKFLOW_COLUMNS}`);
  await pool.query(
    `ALTER TABLE change_control_cases ${APPROVAL_WORKFLOW_COLUMNS}`,
  );
}
