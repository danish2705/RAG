import { pool } from "../db.js";

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
    `SELECT id, query, saved_by, classification, status, created_at, 'Deviation' AS case_type
     FROM deviation_cases
     ${dataWhereA}

     UNION ALL

     SELECT id, query, saved_by, classification, status, created_at, 'Change Control' AS case_type
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

export async function getDeviationCaseById(
  id: string,
): Promise<unknown | null> {
  const result = await pool.query(
    `SELECT id, query, saved_by, classification, impact_assessment,
            rca, capa, status, halted_at, created_at
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
    `SELECT id, query, saved_by, classification, change_impact_assessment,
            risk_criticality, validation_testing, implementation_control,
            final_summary, status, halted_at, created_at
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
}

export async function saveDeviationCase(
  data: SaveDeviationCaseInput,
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO deviation_cases
      (query, classification, impact_assessment, rca, capa, status, halted_at, saved_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
}

export async function saveChangeControlCase(
  data: SaveChangeControlCaseInput,
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO change_control_cases
      (query, classification, change_impact_assessment, risk_criticality,
       validation_testing, implementation_control, final_summary,
       status, halted_at, saved_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
