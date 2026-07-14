import type { Request, Response } from "express";
import {
  saveDeviationCase,
  getDeviationCases,
  saveChangeControlCase,
  getChangeControlCases,
  getCombinedCases,
  getDeviationCaseById,
  getChangeControlCaseById,
  type ListCasesParams,
} from "../repository/caseRepository.js";

function parseListParams(req: Request): ListCasesParams {
  const q = req.query;
  return {
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    sortField: typeof q.sortField === "string" ? q.sortField : undefined,
    sortDir:
      q.sortDir === "asc" ? "asc" : q.sortDir === "desc" ? "desc" : undefined,
    search: typeof q.search === "string" ? q.search : undefined,
    classification:
      typeof q.classification === "string" ? q.classification : undefined,
    status: typeof q.status === "string" ? q.status : undefined,
  };
}

// SAVE: Persist a completed deviation case to the DB.
export async function saveCase(req: Request, res: Response): Promise<void> {
  const id = await saveDeviationCase(req.body ?? {});
  res.json({ id });
}

// GET ALL CASES: Returns a page of deviation cases for the DB Log page,
// filtered/sorted/paginated server-side.
export async function listCases(req: Request, res: Response): Promise<void> {
  const result = await getDeviationCases(parseListParams(req));
  res.json(result);
}

// SAVE (Change Control): Persist a completed Change Control case to the DB.
export async function saveChangeControlCaseHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const id = await saveChangeControlCase(req.body ?? {});
  res.json({ id });
}

// GET ALL CASES (Change Control): for the DB Log page, filtered/sorted/paginated
// server-side.
export async function listChangeControlCases(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await getChangeControlCases(parseListParams(req));
  res.json(result);
}

// GET COMBINED RECORDS: single UNION ALL query across both case types for
// the Records page — gives an accurate row count/order across both tables
// instead of merging two independently-paginated calls.
export async function listCombinedRecords(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await getCombinedCases(parseListParams(req));
  res.json(result);
}

// GET ONE CASE (by id + case_type): used by the View modal, since the
// combined list above only returns summary columns (no rca/capa/
// risk_criticality/etc). Full detail is fetched on demand per row.
export async function getCaseDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;

  if (caseType === "Change Control") {
    const record = await getChangeControlCaseById(id);
    if (!record) {
      res.status(404).json({ error: "Change control case not found" });
      return;
    }
    res.json({ ...record, case_type: "Change Control" });
    return;
  }

  const record = await getDeviationCaseById(id);
  if (!record) {
    res.status(404).json({ error: "Deviation case not found" });
    return;
  }
  res.json({ ...record, case_type: "Deviation" });
}
