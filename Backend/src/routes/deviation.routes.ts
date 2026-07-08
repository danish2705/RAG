import { Router } from "express";
import { requireReady } from "../middleware/requireReady.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as deviationsController from "../controllers/deviation.controller.js";

const router = Router();

// Classification / routing ONLY.
router.post(
  "/inputQuery",
  requireReady,
  asyncHandler(deviationsController.inputQuery),
);

// Impact / severity assessment.
router.post(
  "/deviations/impact-assessment",
  requireReady,
  asyncHandler(deviationsController.impactAssessment),
);

// Root cause analysis.
router.post(
  "/deviations/rca",
  requireReady,
  asyncHandler(deviationsController.rca),
);

// CAPA recommendations. (No requireReady — matches original: doesn't call retrieveContext.)
router.post("/deviations/capa", asyncHandler(deviationsController.capa));

export default router;
