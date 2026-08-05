import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as casesController from "../controllers/cases.controller.js";
import * as commentsController from "../controllers/comments.controller.js";

const router = Router();

// Deviation cases.
router.post("/save", asyncHandler(casesController.saveCase));
router.get("/cases", asyncHandler(casesController.listCases));

// Change control cases.
router.post(
  "/change-control/save",
  asyncHandler(casesController.saveChangeControlCaseHandler),
);
router.get(
  "/change-control/cases",
  asyncHandler(casesController.listChangeControlCases),
);

// Similar-query check: used by the New Deviation/Change Control intake form
// to warn when the description looks like something already submitted.
router.post(
  "/cases/check-similar",
  asyncHandler(casesController.checkSimilarQuery),
);

// Combined Records page: single UNION ALL query across both case types,
// so pagination/sorting is accurate across the merged view.
router.get("/records", asyncHandler(casesController.listCombinedRecords));

// Single case detail (by id + ?case_type=Deviation|Change Control) — used
// by the View modal, since /records only returns summary columns.
router.get("/records/:id", asyncHandler(casesController.getCaseDetail));

// Per-section comment thread on a case (Records page "View" modal). Body
// for POST: { case_type, section, comment, created_by }. Notifies the
// original submitter (saved_by) unless they're commenting on their own case.
router.get(
  "/records/:id/comments",
  asyncHandler(commentsController.listComments),
);
router.post(
  "/records/:id/comments",
  asyncHandler(commentsController.createComment),
);

// Approve a record (by id + ?case_type=Deviation|Change Control). Body:
// { approved_by: string, updates: { ...edited sections... } }. Applies the
// approver's edits and sets approval_status = 'approved'.
router.patch("/records/:id/approve", asyncHandler(casesController.approveCase));

// Reject a record (by id + ?case_type=Deviation|Change Control). Body:
// { rejected_by: string, approver_role: string, reason?: string }. Sends the
// case back to the submitter for corrections instead of approving it.
router.patch("/records/:id/reject", asyncHandler(casesController.rejectCase));

// Mark a pending record as being actively reviewed (by id + ?case_type=...).
// Fired when the assigned approver opens the case — workflow visibility only.
router.patch(
  "/records/:id/start-review",
  asyncHandler(casesController.startReview),
);

// Resubmit a rejected record (by id + ?case_type=Deviation|Change Control).
// Body: { resubmitted_by, approver_role, submitted_to?, updates }. Only the
// original submitter or an Admin may resubmit; flips back to 'pending'.
router.patch(
  "/records/:id/resubmit",
  asyncHandler(casesController.resubmitCase),
);

// List of names that can be picked as an approver in the "Submit for
// Approval" dropdown.
router.get("/approvers", asyncHandler(casesController.listApprovers));

// Hard-delete a record (by id + ?case_type=Deviation|Change Control), body:
// { deleted_by: string, reason?: string }. The full row is snapshotted into
// the audit log before it's removed.
router.delete("/records/:id", asyncHandler(casesController.deleteCase));

export default router;
