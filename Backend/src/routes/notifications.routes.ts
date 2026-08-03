import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as notificationsController from "../controllers/notifications.controller.js";

const router = Router();

// List notifications for the logged-in user (matched by display name).
router.get("/notifications", asyncHandler(notificationsController.listNotifications));

// Mark a single notification read.
router.patch(
  "/notifications/:id/read",
  asyncHandler(notificationsController.markRead),
);

// Mark every notification for a recipient read (e.g. "clear all" in the bell dropdown).
router.patch(
  "/notifications/read-all",
  asyncHandler(notificationsController.markAllRead),
);

export default router;
