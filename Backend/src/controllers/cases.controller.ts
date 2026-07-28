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
  approveDeviationCase,
  approveChangeControlCase,
  getSimilarQueryCandidates,
  type ListCasesParams,
} from "../repository/caseRepository.js";
import {
  recordAuditEntries,
  recordAuditEntry,
} from "../repository/auditRepository.js";
import { buildAuditEntriesForSave } from "../utils/provenanceDiff.js";
import { textSimilarity } from "../utils/textSimilarity.js";

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
    submittedTo: typeof q.submittedTo === "string" ? q.submittedTo : undefined,
    approvalStatus:
      typeof q.approvalStatus === "string" ? q.approvalStatus : undefined,
  };
}

// SAVE: Persist a completed deviation case to the DB.
export async function saveCase(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  // `submitted_to` (the approver) rides along in the same body the client
  // already sends; the repository defaults approval_status to 'pending'.
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

// CHECK SIMILAR QUERY: called from the New Deviation/Change Control intake
// form before it submits for AI analysis. Compares the free-text description
// the user just typed against recent cases' descriptions and returns the
// closest few matches (if any look like a near-duplicate), so the frontend
// can prompt "this looks like something already asked" before proceeding.
const SIMILARITY_THRESHOLD = 0.35;
const MAX_MATCHES = 5;
// Below this length there just isn't enough text to compare meaningfully —
// skip the check rather than risk noisy false positives on short input.
const MIN_DESCRIPTION_LENGTH = 15;

export async function checkSimilarQuery(
  req: Request,
  res: Response,
): Promise<void> {
  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  if (description.length < MIN_DESCRIPTION_LENGTH) {
    res.json({ hasSimilar: false, matches: [] });
    return;
  }

  const candidates = await getSimilarQueryCandidates();

  const scored = candidates
    .filter((c) => !!c.description)
    .map((c) => ({
      id: c.id,
      case_type: c.case_type,
      classification: c.classification,
      saved_by: c.saved_by,
      created_at: c.created_at,
      query: c.query,
      description: c.description as string,
      similarity: textSimilarity(description, c.description as string),
    }))
    .filter((c) => c.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_MATCHES);

  res.json({ hasSimilar: scored.length > 0, matches: scored });
}

// APPROVE ONE CASE (by id + case_type): applies the approver's edits and
// flips approval_status to 'approved' in a single UPDATE, then snapshots the
// approved row into the audit log. Body carries the (partial) edited
// sections; anything omitted is left untouched via COALESCE in the repo.
export async function approveCase(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;
  const body = req.body ?? {};

  const approvedBy =
    typeof body.approved_by === "string" && body.approved_by.trim()
      ? body.approved_by.trim()
      : "Unknown";
  const approverRole =
    typeof body.approver_role === "string" ? body.approver_role.trim() : "";

  const isChangeControl = caseType === "Change Control";

  // Look up the case first so we can check who it was actually submitted
  // to — the client's own claim of "approved_by" is never trusted alone.
  // Admins are exempt from the submitted_to match.
  const existing = (
    isChangeControl
      ? await getChangeControlCaseById(id)
      : await getDeviationCaseById(id)
  ) as Record<string, unknown> | null;

  if (!existing) {
    res.status(404).json({
      error: isChangeControl
        ? "Change control case not found"
        : "Deviation case not found",
    });
    return;
  }

  const submittedTo =
    typeof existing.submitted_to === "string" ? existing.submitted_to : "";
  const isAssignedApprover =
    !!submittedTo && approvedBy.toLowerCase() === submittedTo.toLowerCase();

  if (approverRole !== "Admin" && !isAssignedApprover) {
    res.status(403).json({
      error: "Only the assigned approver or an Admin can approve this case.",
    });
    return;
  }

  const updatedRow = isChangeControl
    ? await approveChangeControlCase(id, body.updates ?? {})
    : await approveDeviationCase(id, body.updates ?? {});

  if (!updatedRow) {
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
    action: "status_changed",
    source: "human",
    performed_by: approvedBy,
    field_name: "approval_status",
    new_value: "approved",
    record_snapshot: updatedRow,
    reason: "Case approved",
  });

  res.json({ success: true, id, approval_status: "approved" });
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
