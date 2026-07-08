import { Router } from "express";
import { requireReady } from "../middleware/requireReady.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as changeControlController from "../controllers/changeControl.controller.js";

const router = Router();

// Change Impact Assessment (Stage 1).
router.post(
  "/impact-assessment",
  requireReady,
  asyncHandler(changeControlController.changeImpactAssessment),
);

// Risk & Criticality Evaluation (Stage 2).
router.post(
  "/risk-criticality",
  requireReady,
  asyncHandler(changeControlController.riskCriticality),
);

// Validation & Testing Strategy (Stage 3).
router.post(
  "/validation-testing",
  requireReady,
  asyncHandler(changeControlController.validationTesting),
);

// Implementation & Control Actions (Stage 4).
router.post(
  "/implementation-control",
  requireReady,
  asyncHandler(changeControlController.implementationControl),
);

// Final Change Control Summary (Stage 5). (No requireReady — matches original.)
router.post(
  "/final-summary",
  asyncHandler(changeControlController.finalSummary),
);

export default router;
