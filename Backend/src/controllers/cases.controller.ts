import type { Request, Response } from "express";
import {
  saveDeviationCase,
  getDeviationCases,
  saveChangeControlCase,
  getChangeControlCases,
  getCombinedCases,
  getDeviationCaseById,
  getChangeControlCaseById,
  deleteDeviationCase,
  deleteChangeControlCase,
  type ListCasesParams,
} from "../repository/caseRepository.js";
import {
  recordAuditEntries,
  recordAuditEntry,
} from "../repository/auditRepository.js";
import { buildAuditEntriesForSave } from "../utils/provenanceDiff.js";

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
  const body = req.body ?? {};
  const id = await saveDeviationCase(body);

  // The frontend already sends `provenance` carrying every field's
  // ai-vs-human-edited state — capture it as audit entries now that we
  // have a case id to attach them to.
  const auditEntries = buildAuditEntriesForSave({
    entityType: "Deviation",
    entityId: String(id),
    savedBy: String(body.saved_by ?? "Unknown"),
    provenance: body.provenance,
  });
  await recordAuditEntries(auditEntries);

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
  const body = req.body ?? {};
  const id = await saveChangeControlCase(body);

  const auditEntries = buildAuditEntriesForSave({
    entityType: "Change Control",
    entityId: String(id),
    savedBy: String(body.saved_by ?? "Unknown"),
    provenance: body.provenance,
  });
  await recordAuditEntries(auditEntries);

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

// DELETE ONE CASE (by id + case_type): hard-deletes the row from the DB.
// Before deleting, the full row is snapshotted into audit_log so the
// Audit Trail page can still show that the record existed, what it
// contained, who deleted it, and when — even though it's gone from
// deviation_cases / change_control_cases.
export async function deleteCase(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;
  const deletedBy =
    typeof req.body?.deleted_by === "string" && req.body.deleted_by.trim()
      ? req.body.deleted_by.trim()
      : "Unknown";
  const reason = typeof req.body?.reason === "string" ? req.body.reason : null;

  const isChangeControl = caseType === "Change Control";
  const deletedRow = isChangeControl
    ? await deleteChangeControlCase(id)
    : await deleteDeviationCase(id);

  if (!deletedRow) {
    res.status(404).json({
      error: isChangeControl
        ? "Change control case not found"
        : "Deviation case not found",
    });
    return;
  }

  await recordAuditEntry({
    entity_type: isChangeControl ? "Change Control" : "Deviation",
    entity_id: id,
    action: "deleted",
    source: "human",
    performed_by: deletedBy,
    record_snapshot: deletedRow,
    reason,
  });

  res.json({ success: true, id });
}
