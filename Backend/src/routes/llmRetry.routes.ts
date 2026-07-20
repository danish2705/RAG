import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as llmRetryController from "../controllers/llmRetry.controller.js";

const router = Router();

router.post("/", asyncHandler(llmRetryController.createEntry));
router.get("/", asyncHandler(llmRetryController.listEntries));
router.get("/:id", asyncHandler(llmRetryController.getEntry));
router.patch("/:id/status", asyncHandler(llmRetryController.updateStatus));

export default router;
