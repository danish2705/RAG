import { pool } from "../db.js";

export type LlmRetryEntityType = "Deviation" | "Change Control";
export type LlmRetryStatus = "pending" | "not_executed";

// Every stage across both pipelines that calls the LLM — used purely to
// label which step failed; not enforced as a DB enum so new stages don't
// need a migration.
export type LlmRetryStage =
  | "classification"
  | "impact_assessment"
  | "rca"
  | "capa"
  | "change_impact_assessment"
  | "risk_criticality"
  | "validation_testing"
  | "implementation_control"
  | "final_summary";

export interface CreateLlmRetryInput {
  full_name: string;
  entity_type: LlmRetryEntityType;
  pipeline_stage: LlmRetryStage;
  query_text: string;
  error_message?: string | null;
  // Snapshot of the in-progress workflow (the frontend's PipelineResult)
  // at the moment the AI call failed — everything needed to resume right
  // where the user left off. Null for the very first stage
  // (classification), since no pipeline state exists yet at that point.
  pipeline_context?: unknown;
}

export interface LlmRetryRow {
  id: number;
  reference_code: string;
  full_name: string;
  entity_type: LlmRetryEntityType;
  pipeline_stage: LlmRetryStage;
  query_text: string;
  error_message: string | null;
  status: LlmRetryStatus;
  created_at: string;
}

export interface LlmRetryRowWithContext extends LlmRetryRow {
  pipeline_context: unknown;
}

function generateReferenceCode(): string {
  // 5-digit code, zero-padded (e.g. "04213").
  return String(Math.floor(Math.random() * 100000)).padStart(5, "0");
}

// Inserts a new row, retrying with a fresh 5-digit code on the rare unique
// collision (reference_code has a UNIQUE constraint — see the DDL).
export async function createLlmRetryEntry(
  input: CreateLlmRetryInput,
): Promise<LlmRetryRow> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const referenceCode = generateReferenceCode();
    try {
      const result = await pool.query(
        `INSERT INTO llm_retry_queue
          (reference_code, full_name, entity_type, pipeline_stage, query_text, error_message, status, pipeline_context)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
         RETURNING id, reference_code, full_name, entity_type, pipeline_stage,
                   query_text, error_message, status, created_at`,
        [
          referenceCode,
          input.full_name,
          input.entity_type,
          input.pipeline_stage,
          input.query_text,
          input.error_message ?? null,
          input.pipeline_context !== undefined
            ? JSON.stringify(input.pipeline_context)
            : null,
        ],
      );
      return result.rows[0];
    } catch (err: any) {
      // 23505 = unique_violation on Postgres; retry with a new code.
      if (err?.code === "23505" && attempt < MAX_ATTEMPTS) continue;
      throw err;
    }
  }

  throw new Error("Could not generate a unique reference code, please retry.");
}

export interface ListLlmRetryParams {
  page?: number;
  pageSize?: number;
  status?: LlmRetryStatus | "all";
  entityType?: LlmRetryEntityType | "all";
  search?: string; // matches full_name OR reference_code
}

export interface PaginatedLlmRetry {
  data: LlmRetryRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function listLlmRetryEntries(
  params: ListLlmRetryParams,
): Promise<PaginatedLlmRetry> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(params.pageSize) || 25));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const values: unknown[] = [];

  if (params.status && params.status !== "all") {
    values.push(params.status);
    where.push(`status = $${values.length}`);
  }
  if (params.entityType && params.entityType !== "all") {
    values.push(params.entityType);
    where.push(`entity_type = $${values.length}`);
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    const idx = values.length;
    where.push(`(full_name ILIKE $${idx} OR reference_code ILIKE $${idx})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM llm_retry_queue ${whereSql}`,
    values,
  );
  const total = countResult.rows[0].total;

  values.push(pageSize);
  const pageSizeIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const dataResult = await pool.query(
    `SELECT id, reference_code, full_name, entity_type, pipeline_stage,
            query_text, error_message, status, created_at
     FROM llm_retry_queue
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

export async function getLlmRetryEntryById(
  id: string,
): Promise<LlmRetryRowWithContext | null> {
  const result = await pool.query(
    `SELECT id, reference_code, full_name, entity_type, pipeline_stage,
            query_text, error_message, status, created_at, pipeline_context
     FROM llm_retry_queue
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateLlmRetryStatus(
  id: string,
  status: LlmRetryStatus,
): Promise<LlmRetryRow | null> {
  const result = await pool.query(
    `UPDATE llm_retry_queue
     SET status = $2
     WHERE id = $1
     RETURNING id, reference_code, full_name, entity_type, pipeline_stage,
               query_text, error_message, status, created_at`,
    [id, status],
  );
  return result.rows[0] ?? null;
}
