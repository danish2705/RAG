import { pool } from "../db.js";

/**
 * Data-access layer for persisted deviation / change-control cases.
 * Pulled out of server.ts so raw SQL doesn't live inside route handlers —
 * this is the one place `/api/save`, `/api/cases`, `/api/change-control/save`,
 * and `/api/change-control/cases` go through.
 */

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

export async function getAllDeviationCases(): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       id,
       query,
       saved_by,
       classification,
       impact_assessment,
       rca,
       capa,
       status,
       halted_at,
       created_at
     FROM deviation_cases
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

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

export async function getAllChangeControlCases(): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       id,
       query,
       saved_by,
       classification,
       change_impact_assessment,
       risk_criticality,
       validation_testing,
       implementation_control,
       final_summary,
       status,
       halted_at,
       created_at
     FROM change_control_cases
     ORDER BY created_at DESC`,
  );
  return result.rows;
}
