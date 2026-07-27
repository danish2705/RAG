import { pool } from "../db.js";
import { parseMetadata } from "../utils/parseMetadata.js";

// ---------------------------------------------------------------------------
// Shared query params for list endpoints
// ---------------------------------------------------------------------------

export interface ListCasesParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
  search?: string; // matches saved_by OR query (ILIKE)
  classification?: string; // exact match against classification->>'classification'
  status?: string;
  // Approvals page filters:
  submittedTo?: string; // case-insensitive exact match on submitted_to
  approvalStatus?: string; // 'pending' | 'approved'
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Whitelist of columns each list endpoint is allowed to sort by.
// Never interpolate a client-supplied column name directly into SQL.
const DEVIATION_SORT_COLUMNS: Record<string, string> = {
  saved_by: "saved_by",
  created_at: "created_at",
  status: "status",
  classification: "classification->>'classification'",
};

const CHANGE_CONTROL_SORT_COLUMNS: Record<string, string> = {
  saved_by: "saved_by",
  created_at: "created_at",
  status: "status",
  classification: "classification->>'classification'",
};

function normalizeListParams(params: ListCasesParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const sortDir = params.sortDir === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * pageSize;
  return { page, pageSize, sortDir, offset };
}

// ---------------------------------------------------------------------------
// Combined cases (Records page list) — UNION ALL across both tables so that
// pagination reflects a true, correctly-ordered count across both case
// types, rather than merging two independently-paginated result sets.
//
// Only the columns common to both tables (and shown in the list view) are
// selected here. Full case detail (rca/capa, risk_criticality/validation,
// etc.) is fetched separately per-row via getDeviationCaseById /
// getChangeControlCaseById when the user opens the View modal.
// ---------------------------------------------------------------------------

export interface CombinedCaseRow {
  id: number | string;
  query: unknown;
  saved_by: unknown;
  submitted_to: unknown;
  approval_status: unknown;
  classification: unknown;
  status: unknown;
  created_at: string;
  case_type: "Deviation" | "Change Control";
}

const COMBINED_SORT_COLUMNS: Record<string, string> = {
  saved_by: "saved_by",
  created_at: "created_at",
  status: "status",
  classification: "classification->>'classification'",
};

export async function getCombinedCases(
  params: ListCasesParams,
): Promise<PaginatedResult<CombinedCaseRow>> {
  const { page, pageSize, sortDir, offset } = normalizeListParams(params);
  const sortColumn =
    COMBINED_SORT_COLUMNS[params.sortField ?? "created_at"] ?? "created_at";

  // Build one shared WHERE clause; parameters are duplicated across both
  // halves of the UNION since each SELECT needs its own placeholders.
  const conditions: string[] = [];
  const searchParams: unknown[] = [];

  if (params.search) {
    searchParams.push(`%${params.search}%`);
    conditions.push(
      `(saved_by ILIKE $PLACEHOLDER OR query ILIKE $PLACEHOLDER)`,
    );
  }
  if (params.classification && params.classification !== "all") {
    searchParams.push(params.classification);
    conditions.push(`classification->>'classification' = $PLACEHOLDER`);
  }
  if (params.status && params.status !== "all") {
    searchParams.push(params.status);
    conditions.push(`status = $PLACEHOLDER`);
  }
  // Approvals page: only rows assigned to a given approver (case-insensitive).
  if (params.submittedTo) {
    searchParams.push(params.submittedTo);
    conditions.push(`LOWER(submitted_to) = LOWER($PLACEHOLDER)`);
  }
  // Approvals page: filter by pending / approved.
  if (params.approvalStatus && params.approvalStatus !== "all") {
    searchParams.push(params.approvalStatus);
    conditions.push(`approval_status = $PLACEHOLDER`);
  }

  // Substitute real, sequential placeholders separately for each half of
  // the UNION so both sides have their own copies of the same values.
  function buildWhere(startIdx: number): { sql: string; nextIdx: number } {
    let idx = startIdx;
    const clauses = conditions.map((clause) => {
      // Each clause may contain the placeholder token once or twice
      // (the search clause uses it twice for saved_by/query).
      return clause.replace(/\$PLACEHOLDER/g, () => `$${idx++}`);
    });
    return {
      sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
      nextIdx: idx,
    };
  }

  // --- COUNT query ---
  const countValuesA = [...searchParams];
  const { sql: whereA } = buildWhere(1);
  const countValuesB = [...searchParams];
  const { sql: whereB } = buildWhere(countValuesA.length + 1);

  const countResult = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM deviation_cases ${whereA}) +
       (SELECT COUNT(*) FROM change_control_cases ${whereB})
       AS total`,
    [...countValuesA, ...countValuesB],
  );
  const total = Number(countResult.rows[0].total);

  // --- DATA query ---
  const dataValuesA = [...searchParams];
  const { sql: dataWhereA, nextIdx } = buildWhere(1);
  const dataValuesB = [...searchParams];
  const { sql: dataWhereB } = buildWhere(nextIdx);

  const limitIdx = dataValuesA.length + dataValuesB.length + 1;
  const offsetIdx = limitIdx + 1;

  const dataResult = await pool.query(
    `SELECT id, query, saved_by, submitted_to, approval_status, classification, status, created_at, 'Deviation' AS case_type
     FROM deviation_cases
     ${dataWhereA}

     UNION ALL

     SELECT id, query, saved_by, submitted_to, approval_status, classification, status, created_at, 'Change Control' AS case_type
     FROM change_control_cases
     ${dataWhereB}

     ORDER BY ${sortColumn} ${sortDir}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...dataValuesA, ...dataValuesB, pageSize, offset],
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

// ---------------------------------------------------------------------------
// Similar-query candidates — used by the "this looks like something already
// asked" prompt on the New Deviation/Change Control intake form. Pulls the
// most recent rows (cheap upper bound) from both tables; the actual
// similarity scoring happens in JS (see utils/textSimilarity.ts) since it's
// only comparing free text, not something worth a DB extension for.
// ---------------------------------------------------------------------------

export interface SimilarQueryCandidate {
  id: number | string;
  query: string;
  description: string | null;
  saved_by: unknown;
  classification: unknown;
  created_at: string;
  case_type: "Deviation" | "Change Control";
}

export async function getSimilarQueryCandidates(
  limit = 300,
): Promise<SimilarQueryCandidate[]> {
  const result = await pool.query(
    `SELECT id, query, metadata->>'description' AS description, saved_by,
            classification->>'classification' AS classification, created_at,
            'Deviation' AS case_type
     FROM deviation_cases

     UNION ALL

     SELECT id, query, metadata->>'description' AS description, saved_by,
            classification->>'classification' AS classification, created_at,
            'Change Control' AS case_type
     FROM change_control_cases

     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function getDeviationCaseById(
  id: string,
): Promise<unknown | null> {
  const result = await pool.query(
    `SELECT id, query, saved_by, submitted_to, approval_status, classification,
            impact_assessment, rca, capa, status, halted_at, created_at
     FROM deviation_cases
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getChangeControlCaseById(
  id: string,
): Promise<unknown | null> {
  const result = await pool.query(
    `SELECT id, query, saved_by, submitted_to, approval_status, classification,
            change_impact_assessment, risk_criticality, validation_testing,
            implementation_control, final_summary, status, halted_at, created_at
     FROM change_control_cases
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Deviation cases
// ---------------------------------------------------------------------------

export interface SaveDeviationCaseInput {
  query: unknown;
  classification: unknown;
  impact_assessment: unknown;
  rca: unknown;
  capa: unknown;
  status: unknown;
  halted_at: unknown;
  saved_by: unknown;
  submitted_to?: unknown; // approver name captured on the Summary submit popup
}

export async function saveDeviationCase(
  data: SaveDeviationCaseInput,
): Promise<number> {
  // Extract structured fields (site, source_system, event_type, etc.) out
  // of the free-text `query` block so they can be queried/grouped on
  // directly (e.g. the dashboard's "Events by Site" chart) instead of
  // regex-scanning `query` on every read.
  const metadata = parseMetadata(data.query);

  const result = await pool.query(
    `INSERT INTO deviation_cases
      (query, classification, impact_assessment, rca, capa, status, halted_at,
       saved_by, submitted_to, approval_status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
     RETURNING id`,
    [
      data.query,
      JSON.stringify(data.classification),
      JSON.stringify(data.impact_assessment),
      JSON.stringify(data.rca),
      JSON.stringify(data.capa),
      data.status,
      data.halted_at,
      data.saved_by,
      data.submitted_to ?? null,
      JSON.stringify(metadata),
    ],
  );
  return result.rows[0].id;
}

export async function getDeviationCases(
  params: ListCasesParams,
): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, sortDir, offset } = normalizeListParams(params);
  const sortColumn =
    DEVIATION_SORT_COLUMNS[params.sortField ?? "created_at"] ?? "created_at";

  const whereClauses: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    values.push(`%${params.search}%`);
    whereClauses.push(
      `(saved_by ILIKE $${values.length} OR query ILIKE $${values.length})`,
    );
  }

  if (params.classification && params.classification !== "all") {
    values.push(params.classification);
    whereClauses.push(`classification->>'classification' = $${values.length}`);
  }

  if (params.status && params.status !== "all") {
    values.push(params.status);
    whereClauses.push(`status = $${values.length}`);
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM deviation_cases ${whereSql}`,
    values,
  );
  const total = countResult.rows[0].total;

  values.push(pageSize);
  const pageSizeIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const dataResult = await pool.query(
    `SELECT
       id, query, saved_by, classification, impact_assessment,
       rca, capa, status, halted_at, created_at
     FROM deviation_cases
     ${whereSql}
     ORDER BY ${sortColumn} ${sortDir}
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

// Hard-delete a deviation case, returning the deleted row so the caller can
// snapshot it into the audit log before it's gone for good.
export async function deleteDeviationCase(
  id: string,
): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    `DELETE FROM deviation_cases WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

// Retained for any internal/background code that still needs the full set
// (e.g. exports). Prefer getDeviationCases() for anything user-facing.
export async function getAllDeviationCases(): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       id, query, saved_by, classification, impact_assessment,
       rca, capa, status, halted_at, created_at
     FROM deviation_cases
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Change control cases
// ---------------------------------------------------------------------------

export interface SaveChangeControlCaseInput {
  query: unknown;
  classification: unknown;
  change_impact_assessment: unknown;
  risk_criticality: unknown;
  validation_testing: unknown;
  implementation_control: unknown;
  final_summary: unknown;
  status: unknown;
  halted_at: unknown;
  saved_by: unknown;
  submitted_to?: unknown; // approver name captured on the Summary submit popup
}

export async function saveChangeControlCase(
  data: SaveChangeControlCaseInput,
): Promise<number> {
  // Extract structured fields (site, source_system, event_type, etc.) out
  // of the free-text `query` block, same as saveDeviationCase above.
  const metadata = parseMetadata(data.query);

  const result = await pool.query(
    `INSERT INTO change_control_cases
      (query, classification, change_impact_assessment, risk_criticality,
       validation_testing, implementation_control, final_summary,
       status, halted_at, saved_by, submitted_to, approval_status, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12)
     RETURNING id`,
    [
      data.query,
      JSON.stringify(data.classification),
      JSON.stringify(data.change_impact_assessment),
      JSON.stringify(data.risk_criticality),
      JSON.stringify(data.validation_testing),
      JSON.stringify(data.implementation_control),
      JSON.stringify(data.final_summary),
      data.status,
      data.halted_at,
      data.saved_by,
      data.submitted_to ?? null,
      JSON.stringify(metadata),
    ],
  );
  return result.rows[0].id;
}

export async function getChangeControlCases(
  params: ListCasesParams,
): Promise<PaginatedResult<unknown>> {
  const { page, pageSize, sortDir, offset } = normalizeListParams(params);
  const sortColumn =
    CHANGE_CONTROL_SORT_COLUMNS[params.sortField ?? "created_at"] ??
    "created_at";

  const whereClauses: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    values.push(`%${params.search}%`);
    whereClauses.push(
      `(saved_by ILIKE $${values.length} OR query ILIKE $${values.length})`,
    );
  }

  if (params.classification && params.classification !== "all") {
    values.push(params.classification);
    whereClauses.push(`classification->>'classification' = $${values.length}`);
  }

  if (params.status && params.status !== "all") {
    values.push(params.status);
    whereClauses.push(`status = $${values.length}`);
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM change_control_cases ${whereSql}`,
    values,
  );
  const total = countResult.rows[0].total;

  values.push(pageSize);
  const pageSizeIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const dataResult = await pool.query(
    `SELECT
       id, query, saved_by, classification, change_impact_assessment,
       risk_criticality, validation_testing, implementation_control,
       final_summary, status, halted_at, created_at
     FROM change_control_cases
     ${whereSql}
     ORDER BY ${sortColumn} ${sortDir}
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

// Hard-delete a change control case, returning the deleted row so the
// caller can snapshot it into the audit log before it's gone for good.
export async function deleteChangeControlCase(
  id: string,
): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    `DELETE FROM change_control_cases WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] ?? null;
}

// Retained for any internal/background code that still needs the full set.
export async function getAllChangeControlCases(): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       id, query, saved_by, classification, change_impact_assessment,
       risk_criticality, validation_testing, implementation_control,
       final_summary, status, halted_at, created_at
     FROM change_control_cases
     ORDER BY created_at DESC`,
  );
  return result.rows;
}
// ---------------------------------------------------------------------------
// Approvals — apply the approver's edits and flip approval_status to
// 'approved' in a single UPDATE. Only the JSON pipeline sections plus the
// free-text query are editable in the approval modal; the immutable fields
// (id, saved_by, submitted_to, created_at) are never touched here.
//
// Each `updates` value is optional: only the keys present are overwritten,
// so a partial edit won't blank out sections the approver didn't open.
// Returns the fully-updated row (for the audit snapshot), or null if the
// id doesn't exist.
// ---------------------------------------------------------------------------

export interface ApproveDeviationInput {
  query?: unknown;
  classification?: unknown;
  impact_assessment?: unknown;
  rca?: unknown;
  capa?: unknown;
}

export async function approveDeviationCase(
  id: string,
  updates: ApproveDeviationInput,
): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    `UPDATE deviation_cases
        SET query             = COALESCE($2, query),
            classification    = COALESCE($3::jsonb, classification),
            impact_assessment = COALESCE($4::jsonb, impact_assessment),
            rca               = COALESCE($5::jsonb, rca),
            capa              = COALESCE($6::jsonb, capa),
            approval_status   = 'approved'
      WHERE id = $1
      RETURNING *`,
    [
      id,
      updates.query ?? null,
      updates.classification !== undefined
        ? JSON.stringify(updates.classification)
        : null,
      updates.impact_assessment !== undefined
        ? JSON.stringify(updates.impact_assessment)
        : null,
      updates.rca !== undefined ? JSON.stringify(updates.rca) : null,
      updates.capa !== undefined ? JSON.stringify(updates.capa) : null,
    ],
  );
  return result.rows[0] ?? null;
}

export interface ApproveChangeControlInput {
  query?: unknown;
  classification?: unknown;
  change_impact_assessment?: unknown;
  risk_criticality?: unknown;
  validation_testing?: unknown;
  implementation_control?: unknown;
  final_summary?: unknown;
}

export async function approveChangeControlCase(
  id: string,
  updates: ApproveChangeControlInput,
): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    `UPDATE change_control_cases
        SET query                     = COALESCE($2, query),
            classification            = COALESCE($3::jsonb, classification),
            change_impact_assessment  = COALESCE($4::jsonb, change_impact_assessment),
            risk_criticality          = COALESCE($5::jsonb, risk_criticality),
            validation_testing        = COALESCE($6::jsonb, validation_testing),
            implementation_control    = COALESCE($7::jsonb, implementation_control),
            final_summary             = COALESCE($8::jsonb, final_summary),
            approval_status           = 'approved'
      WHERE id = $1
      RETURNING *`,
    [
      id,
      updates.query ?? null,
      updates.classification !== undefined
        ? JSON.stringify(updates.classification)
        : null,
      updates.change_impact_assessment !== undefined
        ? JSON.stringify(updates.change_impact_assessment)
        : null,
      updates.risk_criticality !== undefined
        ? JSON.stringify(updates.risk_criticality)
        : null,
      updates.validation_testing !== undefined
        ? JSON.stringify(updates.validation_testing)
        : null,
      updates.implementation_control !== undefined
        ? JSON.stringify(updates.implementation_control)
        : null,
      updates.final_summary !== undefined
        ? JSON.stringify(updates.final_summary)
        : null,
    ],
  );
  return result.rows[0] ?? null;
}
