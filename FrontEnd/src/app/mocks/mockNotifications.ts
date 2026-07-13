export interface QMSNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  domain: "deviation" | "capa" | "change_control" | "system";
  priority: "high" | "medium" | "low";
  read: boolean;
}

export const mockNotifications: QMSNotification[] = [
  {
    id: "notif-1",
    title: "Critical Deviation Triggered",
    message: "DEV-2026-089 (Temperature excursion in Cold Storage B) confidence score dropped below 70%. Human review required.",
    timestamp: "10 mins ago",
    domain: "deviation",
    priority: "high",
    read: false,
  },
  {
    id: "notif-2",
    title: "CAPA Due Date Approaching",
    message: "CAPA-2026-042 effectiveness check is due in 48 hours. Assigned to Quality Assurance team.",
    timestamp: "1 hour ago",
    domain: "capa",
    priority: "medium",
    read: false,
  },
  {
    id: "notif-3",
    title: "Change Control Impact Assessment",
    message: "CC-2026-015 AI Impact Assessment completed with Minor severity across all parameters.",
    timestamp: "3 hours ago",
    domain: "change_control",
    priority: "low",
    read: false,
  },
  {
    id: "notif-4",
    title: "System Audit Trail Exported",
    message: "Global QMS audit logs for Q2 were successfully archived by system admin.",
    timestamp: "Yesterday",
    domain: "system",
    priority: "low",
    read: true,
  },
  {
    id: "notif-5",
    title: "Root Cause Analysis Overridden",
    message: "DEV-2026-071 root cause was manually overridden by Dr. Aris. Audit trail updated.",
    timestamp: "2 days ago",
    domain: "deviation",
    priority: "medium",
    read: true,
  },
];