import { pool } from "../db.js";

// ---------------------------------------------------------------------------
// Notifications — approver-facing alerts, persisted server-side so they show
// up whenever the recipient logs in, not just in the submitter's own browser
// tab. Keyed on the recipient's plain display-name string (same convention
// as submitted_to/saved_by on the case tables), since this project has no
// real users table to FK against — see caseRepository.getApproverCandidates.
// ---------------------------------------------------------------------------

export type NotificationType = "info" | "warning" | "critical" | "success";

export interface CreateNotificationInput {
  recipient: string;
  title: string;
  message: string;
  type?: NotificationType;
  entity_type?: string | null;
  entity_id?: string | null;
  due_date?: unknown;
}

export interface NotificationRow {
  id: number;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  entity_type: string | null;
  entity_id: string | null;
  due_date: string | null;
  is_read: boolean;
  created_at: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow> {
  const result = await pool.query(
    `INSERT INTO notifications
      (recipient, title, message, type, entity_type, entity_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.recipient,
      input.title,
      input.message,
      input.type ?? "info",
      input.entity_type ?? null,
      input.entity_id ?? null,
      input.due_date ?? null,
    ],
  );
  return result.rows[0];
}

// Recipient match is case-insensitive, same as submitted_to lookups
// elsewhere (display names aren't guaranteed consistent casing).
export async function getNotificationsForRecipient(
  recipient: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE LOWER(recipient) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [recipient, limit],
  );
  return result.rows;
}

export async function getUnreadCountForRecipient(
  recipient: string,
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notifications
     WHERE LOWER(recipient) = LOWER($1) AND is_read = false`,
    [recipient],
  );
  return result.rows[0].count;
}

export async function markNotificationRead(
  id: number,
  recipient: string,
): Promise<NotificationRow | null> {
  const result = await pool.query(
    `UPDATE notifications
        SET is_read = true
      WHERE id = $1 AND LOWER(recipient) = LOWER($2)
      RETURNING *`,
    [id, recipient],
  );
  return result.rows[0] ?? null;
}

export async function markAllNotificationsRead(
  recipient: string,
): Promise<void> {
  await pool.query(
    `UPDATE notifications SET is_read = true
      WHERE LOWER(recipient) = LOWER($1) AND is_read = false`,
    [recipient],
  );
}
