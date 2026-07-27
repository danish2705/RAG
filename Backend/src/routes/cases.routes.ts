import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as casesController from "../controllers/cases.controller.js";

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

// Approve a record (by id + ?case_type=Deviation|Change Control). Body:
// { approved_by: string, updates: { ...edited sections... } }. Applies the
// approver's edits and sets approval_status = 'approved'.
router.patch("/records/:id/approve", asyncHandler(casesController.approveCase));

// Hard-delete a record (by id + ?case_type=Deviation|Change Control), body:
// { deleted_by: string, reason?: string }. The full row is snapshotted into
// the audit log before it's removed.
router.delete("/records/:id", asyncHandler(casesController.deleteCase));

export default router;
