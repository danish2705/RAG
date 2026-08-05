import type { Request, Response } from "express";
import {
  getCommentsForCase,
  addComment,
  type CaseType,
} from "../repository/commentRepository.js";
import {
  getDeviationCaseById,
  getChangeControlCaseById,
} from "../repository/caseRepository.js";
import { createNotification } from "../repository/notificationRepository.js";

function resolveCaseType(value: unknown): CaseType {
  return value === "Change Control" ? "Change Control" : "Deviation";
}

// GET /api/records/:id/comments?case_type=Deviation|Change Control
// Matches the shape FrontEnd/src/app/services/commentsApi.ts already
// expects: { data: CaseComment[] }.
export async function listComments(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const caseType = resolveCaseType(req.query.case_type);
  const data = await getCommentsForCase(id, caseType);
  res.json({ data });
}

// POST /api/records/:id/comments
// Body: { case_type, section, comment, created_by }. Returns { data: CaseComment }.
export async function createComment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const body = req.body ?? {};

  const caseType = resolveCaseType(body.case_type);
  const section =
    typeof body.section === "string" && body.section.trim()
      ? body.section.trim()
      : "General";
  const comment =
    typeof body.comment === "string" ? body.comment.trim() : "";
  const createdBy =
    typeof body.created_by === "string" && body.created_by.trim()
      ? body.created_by.trim()
      : "Unknown";

  if (!comment) {
    res.status(400).json({ error: "comment is required" });
    return;
  }

  const created = await addComment({
    case_id: id,
    case_type: caseType,
    section,
    comment,
    created_by: createdBy,
  });

  await notifySubmitterOfComment({ id, caseType, section, comment, createdBy });

  res.json({ data: created });
}

// Fire-and-forget: tell the original submitter someone commented on their
// case — unless they're the one leaving the comment (no point notifying
// yourself about your own comment on your own case).
async function notifySubmitterOfComment(params: {
  id: string;
  caseType: CaseType;
  section: string;
  comment: string;
  createdBy: string;
}): Promise<void> {
  try {
    const record = (
      params.caseType === "Change Control"
        ? await getChangeControlCaseById(params.id)
        : await getDeviationCaseById(params.id)
    ) as Record<string, unknown> | null;
    if (!record) return;

    const savedBy =
      typeof record.saved_by === "string" ? record.saved_by.trim() : "";
    if (!savedBy) return;
    if (savedBy.toLowerCase() === params.createdBy.toLowerCase()) return;

    const preview =
      params.comment.length > 140
        ? `${params.comment.slice(0, 137)}...`
        : params.comment;

    await createNotification({
      recipient: savedBy,
      title: `New comment on your ${params.caseType} case`,
      message: `${params.createdBy} commented on ${params.section}: "${preview}"`,
      type: "info",
      entity_type: params.caseType,
      entity_id: params.id,
    });
  } catch (err) {
    console.error("Failed to create comment notification:", err);
  }
}
