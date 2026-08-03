import { apiFetch } from "../utils/api";

export interface NotificationRow {
  id: number;
  recipient: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  entity_type: string | null;
  entity_id: string | null;
  due_date: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  data: NotificationRow[];
  unreadCount: number;
}

/** Notifications addressed to `recipient` (the logged-in user's display
 *  name) — e.g. "a case was submitted to you for approval". */
export const fetchNotifications = async (
  recipient: string,
): Promise<NotificationsResponse> => {
  if (!recipient) return { data: [], unreadCount: 0 };
  return apiFetch(
    `/api/notifications?recipient=${encodeURIComponent(recipient)}`,
  );
};

export const markNotificationRead = async (
  id: number | string,
  recipient: string,
) => {
  return apiFetch(`/api/notifications/${encodeURIComponent(String(id))}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient }),
  });
};

export const markAllNotificationsRead = async (recipient: string) => {
  return apiFetch(
    `/api/notifications/read-all?recipient=${encodeURIComponent(recipient)}`,
    { method: "PATCH" },
  );
};
