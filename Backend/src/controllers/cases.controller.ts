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
  rejectDeviationCase,
  rejectChangeControlCase,
  startReviewDeviationCase,
  startReviewChangeControlCase,
  resubmitDeviationCase,
  resubmitChangeControlCase,
  getApproverCandidates,
  getSimilarQueryCandidates,
  type ListCasesParams,
} from "../repository/caseRepository.js";
import {
  recordAuditEntries,
  recordAuditEntry,
} from "../repository/auditRepository.js";
import { createNotification } from "../repository/notificationRepository.js";
import { buildAuditEntriesForSave } from "../utils/provenanceDiff.js";
import { textSimilarity } from "../utils/textSimilarity.js";
import { formatDueLabel } from "../utils/dueDate.js";

// Fire-and-forget a "submitted for approval" notification to whoever the
// case was sent to. Best-effort: a notification failure should never fail
// the underlying save/resubmit request.
async function notifyApprover(params: {
  submittedTo: unknown;
  entityType: "Deviation" | "Change Control";
  entityId: string;
  dueDate: unknown;
  submittedBy: unknown;
  /** True when this is a corrected case being sent back after a rejection,
   *  rather than the first time it's been submitted. */
  isResubmission?: boolean;
}): Promise<void> {
  const recipient =
    typeof params.submittedTo === "string" ? params.submittedTo.trim() : "";
  if (!recipient) return;

  const dueLabel = formatDueLabel(params.dueDate);
  const submittedBy =
    typeof params.submittedBy === "string" && params.submittedBy.trim()
      ? params.submittedBy.trim()
      : "Someone";
  const verb = params.isResubmission ? "resubmitted" : "submitted";

  try {
    await createNotification({
      recipient,
      title: params.isResubmission
        ? `${params.entityType} case resubmitted for approval`
        : `New ${params.entityType} case submitted for approval`,
      message: dueLabel
        ? `${submittedBy} ${verb} a ${params.entityType} case for your approval — ${dueLabel}.`
        : `${submittedBy} ${verb} a ${params.entityType} case for your approval.`,
      type: "info",
      entity_type: params.entityType,
      entity_id: params.entityId,
      due_date: params.dueDate ?? null,
    });
  } catch (err) {
    console.error("Failed to create approver notification:", err);
  }
}

// Fire-and-forget the mirror-image notification: tell the original
// submitter what happened once their case is approved or rejected. Reject
// messages fold the approver's reason in directly, since that's the closest
// thing this app has to a "comment" on the case.
async function notifySubmitter(params: {
  savedBy: unknown;
  entityType: "Deviation" | "Change Control";
  entityId: string;
  action: "approved" | "rejected";
  actor: unknown;
  reason?: string | null;
}): Promise<void> {
  const recipient =
    typeof params.savedBy === "string" ? params.savedBy.trim() : "";
  if (!recipient) return;

  const actor =
    typeof params.actor === "string" && params.actor.trim()
      ? params.actor.trim()
      : "Someone";

  const isApproved = params.action === "approved";
  const title = isApproved
    ? `${params.entityType} case approved`
    : `${params.entityType} case rejected`;
  const message = isApproved
    ? `${actor} approved your ${params.entityType} case.`
    : params.reason
      ? `${actor} rejected your ${params.entityType} case: "${params.reason}"`
      : `${actor} rejected your ${params.entityType} case.`;

  try {
    await createNotification({
      recipient,
      title,
      message,
      type: isApproved ? "success" : "warning",
      entity_type: params.entityType,
      entity_id: params.entityId,
    });
  } catch (err) {
    console.error("Failed to create submitter notification:", err);
  }
}

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

  await notifyApprover({
    submittedTo: body.submitted_to,
    entityType: "Deviation",
    entityId: String(id),
    dueDate: body.due_date,
    submittedBy: body.saved_by,
  });

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

  await notifyApprover({
    submittedTo: body.submitted_to,
    entityType: "Change Control",
    entityId: String(id),
    dueDate: body.due_date,
    submittedBy: body.saved_by,
  });

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
    ? await approveChangeControlCase(id, body.updates ?? {}, approvedBy)
    : await approveDeviationCase(id, body.updates ?? {}, approvedBy);

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
    action: "approved",
    source: "human",
    performed_by: approvedBy,
    field_name: "approval_status",
    old_value: existing.approval_status ?? "pending",
    new_value: "approved",
    record_snapshot: updatedRow,
    reason: "Case approved",
  });

  await notifySubmitter({
    savedBy: existing.saved_by,
    entityType: isChangeControl ? "Change Control" : "Deviation",
    entityId: id,
    action: "approved",
    actor: approvedBy,
  });

  res.json({ success: true, id, approval_status: "approved" });
}

// REJECT ONE CASE (by id + case_type): sends the case back to the submitter
// with a reason instead of approving it. Same authorization rule as approve
// — only the assigned approver (or an Admin) may reject.
// Body: { rejected_by: string, approver_role: string, reason?: string }.
export async function rejectCase(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;
  const body = req.body ?? {};

  const rejectedBy =
    typeof body.rejected_by === "string" && body.rejected_by.trim()
      ? body.rejected_by.trim()
      : "Unknown";
  const approverRole =
    typeof body.approver_role === "string" ? body.approver_role.trim() : "";
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : null;

  const isChangeControl = caseType === "Change Control";

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
    !!submittedTo && rejectedBy.toLowerCase() === submittedTo.toLowerCase();

  if (approverRole !== "Admin" && !isAssignedApprover) {
    res.status(403).json({
      error: "Only the assigned approver or an Admin can reject this case.",
    });
    return;
  }

  const updatedRow = isChangeControl
    ? await rejectChangeControlCase(id, rejectedBy, reason)
    : await rejectDeviationCase(id, rejectedBy, reason);

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
    action: "rejected",
    source: "human",
    performed_by: rejectedBy,
    field_name: "approval_status",
    old_value: existing.approval_status ?? "pending",
    new_value: "rejected",
    record_snapshot: updatedRow,
    reason: reason || "Case rejected — sent back to submitter for corrections",
  });

  await notifySubmitter({
    savedBy: existing.saved_by,
    entityType: isChangeControl ? "Change Control" : "Deviation",
    entityId: id,
    action: "rejected",
    actor: rejectedBy,
    reason,
  });

  res.json({ success: true, id, approval_status: "rejected" });
}

// START REVIEW (by id + case_type): flips a 'pending' case to 'in_review'
// the moment the assigned approver opens it, purely for workflow visibility.
// No-op (still succeeds) if the case has already moved past 'pending'.
export async function startReview(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;
  const isChangeControl = caseType === "Change Control";

  const reviewedBy =
    typeof req.body?.reviewed_by === "string" && req.body.reviewed_by.trim()
      ? req.body.reviewed_by.trim()
      : "Unknown";

  const updatedRow = isChangeControl
    ? await startReviewChangeControlCase(id)
    : await startReviewDeviationCase(id);

  // Only log when the case actually flipped to 'in_review' — if it was
  // already past 'pending' (or doesn't exist), this was a no-op and isn't
  // worth an audit entry.
  if (updatedRow) {
    await recordAuditEntry({
      entity_type: isChangeControl ? "Change Control" : "Deviation",
      entity_id: id,
      action: "review_started",
      source: "human",
      performed_by: reviewedBy,
      field_name: "approval_status",
      old_value: "pending",
      new_value: "in_review",
      record_snapshot: updatedRow,
      reason: "Approver opened the case for review",
    });
  }

  // If nothing was updated, either the id doesn't exist or the case is no
  // longer 'pending' — either way this is a best-effort status ping, not
  // something worth failing the request over.
  res.json({
    success: true,
    id,
    approval_status: updatedRow?.approval_status ?? null,
  });
}

// RESUBMIT (by id + case_type): the original submitter edits a rejected
// case and sends it back to an approver. Only the original submitter or an
// Admin may do this. Body: { resubmitted_by, approver_role, submitted_to?,
// updates }.
export async function resubmitCase(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const caseType = req.query.case_type;
  const body = req.body ?? {};

  const resubmittedBy =
    typeof body.resubmitted_by === "string" && body.resubmitted_by.trim()
      ? body.resubmitted_by.trim()
      : "Unknown";
  const approverRole =
    typeof body.approver_role === "string" ? body.approver_role.trim() : "";
  const submittedTo =
    typeof body.submitted_to === "string" && body.submitted_to.trim()
      ? body.submitted_to.trim()
      : undefined;

  const isChangeControl = caseType === "Change Control";

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

  const savedBy = typeof existing.saved_by === "string" ? existing.saved_by : "";
  const isOriginalSubmitter =
    !!savedBy && resubmittedBy.toLowerCase() === savedBy.toLowerCase();

  if (approverRole !== "Admin" && !isOriginalSubmitter) {
    res.status(403).json({
      error: "Only the original submitter or an Admin can resubmit this case.",
    });
    return;
  }

  const updatedRow = isChangeControl
    ? await resubmitChangeControlCase(id, body.updates ?? {}, submittedTo)
    : await resubmitDeviationCase(id, body.updates ?? {}, submittedTo);

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
    action: "resubmitted",
    source: "human",
    performed_by: resubmittedBy,
    field_name: "approval_status",
    old_value: "rejected",
    new_value: "pending",
    record_snapshot: updatedRow,
    reason: "Resubmitted after rejection",
  });

  await notifyApprover({
    submittedTo: updatedRow.submitted_to,
    entityType: isChangeControl ? "Change Control" : "Deviation",
    entityId: id,
    dueDate: updatedRow.due_date,
    submittedBy: resubmittedBy,
    isResubmission: true,
  });

  res.json({ success: true, id, approval_status: "pending" });
}

// GET /api/approvers — the pool of names that can be picked in the
// "Submit for Approval" dropdown. There's no dedicated users table, so this
// is derived from the display names already seen on saved/submitted cases.
export async function listApprovers(
  _req: Request,
  res: Response,
): Promise<void> {
  const approvers = await getApproverCandidates();
  res.json({ data: approvers });
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
