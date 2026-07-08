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

export default router;
