import { pool } from "../db.js";

export type AuditEntityType = "Deviation" | "Change Control";
export type AuditAction =
  | "created"
  | "field_edited"
  | "deleted"
  | "ai_suggestion"
  | "status_changed"
  // Recorded whenever the LLM is unreachable/erroring mid-pipeline and the
  // user's in-progress query gets saved to llm_retry_queue instead of lost.
  | "llm_unavailable";
export type AuditSource = "ai" | "human" | "system";

export interface AuditLogInput {
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  source: AuditSource;
  performed_by: string;
  field_name?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  record_snapshot?: unknown;
  reason?: string | null;
  // Optional explicit timestamp (e.g. a field's modifiedAt from the
  // frontend); defaults to now() in the DB if omitted.
  created_at?: string | null;
}

export interface AuditLogRow {
  id: number;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  source: AuditSource;
  performed_by: string;
  field_name: string | null;
  old_value: unknown;
  new_value: unknown;
  record_snapshot: unknown;
  reason: string | null;
  created_at: string;
}

// Insert a single audit entry.
export async function recordAuditEntry(entry: AuditLogInput): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log
      (entity_type, entity_id, action, source, performed_by,
       field_name, old_value, new_value, record_snapshot, reason, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, now()))`,
    [
      entry.entity_type,
      entry.entity_id,
      entry.action,
      entry.source,
      entry.performed_by,
      entry.field_name ?? null,
      entry.old_value !== undefined ? JSON.stringify(entry.old_value) : null,
      entry.new_value !== undefined ? JSON.stringify(entry.new_value) : null,
      entry.record_snapshot !== undefined
        ? JSON.stringify(entry.record_snapshot)
        : null,
      entry.reason ?? null,
      entry.created_at ?? null,
    ],
  );
}

// Insert many audit entries in one round trip (used when a save carries a
// whole batch of field edits from the frontend's provenance object).
export async function recordAuditEntries(
  entries: AuditLogInput[],
): Promise<void> {
  if (entries.length === 0) return;

  const values: unknown[] = [];
  const rowsSql = entries
    .map((entry, i) => {
      const base = i * 11;
      values.push(
        entry.entity_type,
        entry.entity_id,
        entry.action,
        entry.source,
        entry.performed_by,
        entry.field_name ?? null,
        entry.old_value !== undefined ? JSON.stringify(entry.old_value) : null,
        entry.new_value !== undefined ? JSON.stringify(entry.new_value) : null,
        entry.record_snapshot !== undefined
          ? JSON.stringify(entry.record_snapshot)
          : null,
        entry.reason ?? null,
        entry.created_at ?? null,
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, COALESCE($${base + 11}::timestamptz, now()))`;
    })
    .join(", ");

  await pool.query(
    `INSERT INTO audit_log
      (entity_type, entity_id, action, source, performed_by,
       field_name, old_value, new_value, record_snapshot, reason, created_at)
     VALUES ${rowsSql}`,
    values,
  );
}

export interface ListAuditParams {
  page?: number;
  pageSize?: number;
  startDate?: string; // inclusive, YYYY-MM-DD
  endDate?: string; // inclusive, YYYY-MM-DD
  source?: AuditSource | "all";
  action?: AuditAction | "all";
  entityId?: string;
  search?: string; // matches performed_by OR field_name OR reason
}

export interface PaginatedAudit {
  data: AuditLogRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function listAuditEntries(
  params: ListAuditParams,
): Promise<PaginatedAudit> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(params.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const values: unknown[] = [];

  if (params.startDate) {
    values.push(params.startDate);
    where.push(`created_at >= $${values.length}::date`);
  }
  if (params.endDate) {
    values.push(params.endDate);
    where.push(`created_at < ($${values.length}::date + interval '1 day')`);
  }
  if (params.source && params.source !== "all") {
    values.push(params.source);
    where.push(`source = $${values.length}`);
  }
  if (params.action && params.action !== "all") {
    values.push(params.action);
    where.push(`action = $${values.length}`);
  }
  if (params.entityId) {
    values.push(params.entityId);
    where.push(`entity_id = $${values.length}`);
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    const idx = values.length;
    where.push(
      `(performed_by ILIKE $${idx} OR field_name ILIKE $${idx} OR reason ILIKE $${idx})`,
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM audit_log ${whereSql}`,
    values,
  );
  const total = countResult.rows[0].total;

  values.push(pageSize);
  const pageSizeIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const dataResult = await pool.query(
    `SELECT id, entity_type, entity_id, action, source, performed_by,
            field_name, old_value, new_value, record_snapshot, reason, created_at
     FROM audit_log
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${pageSizeIdx} OFFSET $${offsetIdx}`,
    values,
  );

  return {
    data: dataResult.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
