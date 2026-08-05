import { pool } from "../db.js";

export type CaseType = "Deviation" | "Change Control";

export interface CaseCommentRow {
  id: number;
  case_id: string;
  case_type: CaseType;
  section: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface AddCommentInput {
  case_id: string;
  case_type: CaseType;
  section: string;
  comment: string;
  created_by: string;
}

// All comments for a case (every section), oldest first — the frontend
// slices this per-section client-side (see useCaseComments.forSection).
export async function getCommentsForCase(
  caseId: string,
  caseType: CaseType,
): Promise<CaseCommentRow[]> {
  const result = await pool.query(
    `SELECT * FROM case_comments
     WHERE case_id = $1 AND case_type = $2
     ORDER BY created_at ASC`,
    [caseId, caseType],
  );
  return result.rows;
}

export async function addComment(
  input: AddCommentInput,
): Promise<CaseCommentRow> {
  const result = await pool.query(
    `INSERT INTO case_comments (case_id, case_type, section, comment, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.case_id,
      input.case_type,
      input.section,
      input.comment,
      input.created_by,
    ],
  );
  return result.rows[0];
}
