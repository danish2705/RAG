import type { Request, Response } from "express";
import {
  getNotificationsForRecipient,
  getUnreadCountForRecipient,
  markNotificationRead,
  markAllNotificationsRead,
} from "../repository/notificationRepository.js";

// GET /api/notifications?recipient=<display name> — the frontend has no
// server-side session, so (same as approved_by/rejected_by/submitted_to
// elsewhere) the caller passes the logged-in user's display name explicitly.
export async function listNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  const recipient =
    typeof req.query.recipient === "string" ? req.query.recipient.trim() : "";

  if (!recipient) {
    res.json({ data: [], unreadCount: 0 });
    return;
  }

  const [data, unreadCount] = await Promise.all([
    getNotificationsForRecipient(recipient),
    getUnreadCountForRecipient(recipient),
  ]);

  res.json({ data, unreadCount });
}

// PATCH /api/notifications/:id/read — body: { recipient }. Only the
// recipient the notification was addressed to can mark it read.
export async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const recipient =
    typeof req.body?.recipient === "string" ? req.body.recipient.trim() : "";

  if (!recipient) {
    res.status(400).json({ error: "recipient is required" });
    return;
  }

  const updated = await markNotificationRead(Number(id), recipient);
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json({ success: true, data: updated });
}

// PATCH /api/notifications/read-all?recipient=<display name>
export async function markAllRead(req: Request, res: Response): Promise<void> {
  const recipient =
    typeof req.query.recipient === "string" ? req.query.recipient.trim() : "";

  if (!recipient) {
    res.status(400).json({ error: "recipient is required" });
    return;
  }

  await markAllNotificationsRead(recipient);
  res.json({ success: true });
}
