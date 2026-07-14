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

// Combined Records page: single UNION ALL query across both case types,
// so pagination/sorting is accurate across the merged view.
router.get("/records", asyncHandler(casesController.listCombinedRecords));

// Single case detail (by id + ?case_type=Deviation|Change Control) — used
// by the View modal, since /records only returns summary columns.
router.get("/records/:id", asyncHandler(casesController.getCaseDetail));

export default router;
