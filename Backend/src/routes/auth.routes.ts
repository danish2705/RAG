import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as authController from "../auth/auth.controller.js";

const router = Router();

router.post("/auth/login", asyncHandler(authController.login));
router.post("/auth/sso", asyncHandler(authController.ssoLogin));

export default router;
