import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", asyncHandler(dashboardController.getDashboardSummary));

export default router;