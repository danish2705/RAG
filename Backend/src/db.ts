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
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ
`;

export async function runMigrations(): Promise<void> {
  await pool.query(`ALTER TABLE deviation_cases ${APPROVAL_WORKFLOW_COLUMNS}`);
  await pool.query(
    `ALTER TABLE change_control_cases ${APPROVAL_WORKFLOW_COLUMNS}`,
  );

  // Notifications — surfaces approver-facing alerts (currently: "a case was
  // submitted to you, due <when>") server-side so they persist per recipient
  // instead of living only in the submitter's own browser tab. Keyed on the
  // recipient's plain display-name string, same as submitted_to/saved_by
  // elsewhere in this schema, since there's no real users table to FK against.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      recipient TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      entity_type TEXT,
      entity_id TEXT,
      due_date TIMESTAMPTZ,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_recipient_idx
      ON notifications (LOWER(recipient), created_at DESC)
  `);

  // Case comments — per-section discussion thread on a Deviation/Change
  // Control record, viewed from the Records page's "View" modal
  // (SectionComments.tsx). The frontend already speaks this exact shape
  // (case_id, case_type, section, comment, created_by, created_at) and
  // previously fell back to localStorage when this route didn't exist.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS case_comments (
      id SERIAL PRIMARY KEY,
      case_id TEXT NOT NULL,
      case_type TEXT NOT NULL,
      section TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS case_comments_case_idx
      ON case_comments (case_id, case_type, created_at)
  `);

  // The audit_log.action column has a CHECK constraint written against the
  // original, smaller set of action values. The approval workflow adds new
  // distinct actions (review_started/approved/rejected/resubmitted), so the
  // constraint needs widening or every insert with a new action value fails
  // with "violates check constraint audit_log_action_check".
  //
  // Rather than guess the constraint's name (it may not match Postgres'
  // default naming if it was created/renamed manually), look it up from the
  // catalogs — any CHECK constraint on audit_log whose definition mentions
  // the action column — and drop every match before adding the widened one.
  const { rows: staleConstraints } = await pool.query<{ conname: string }>(
    `SELECT c.conname
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'audit_log'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%action%'`,
  );
  for (const { conname } of staleConstraints) {
    await pool.query(
      `ALTER TABLE audit_log DROP CONSTRAINT "${conname}"`,
    );
  }
  await pool.query(
    `ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check CHECK (
      action IN (
        'created',
        'field_edited',
        'deleted',
        'ai_suggestion',
        'status_changed',
        'llm_unavailable',
        'review_started',
        'approved',
        'rejected',
        'resubmitted'
      )
    )`,
  );
}
