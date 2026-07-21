import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as auditController from "../controllers/audit.controller.js";

const router = Router();

router.get("/", asyncHandler(auditController.listAudit));

export default router;
