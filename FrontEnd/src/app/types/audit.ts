export type AuditEntityType = "Deviation" | "Change Control";
export type AuditAction =
  | "created"
  | "field_edited"
  | "deleted"
  | "ai_suggestion"
  | "status_changed";
export type AuditSource = "ai" | "human" | "system";

/** Raw shape returned by GET /api/audit (one row per audit_log record). */
export interface AuditLogEntry {
  id: number;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  source: AuditSource;
  performed_by: string;
  field_name: string | null;
  old_value: unknown;
  new_value: unknown;
  record_snapshot: unknown;
  reason: string | null;
  created_at: string;
}

export interface AuditListResponse {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Legacy shape kept for the mock fallback / older components. */
export interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  type: "ai" | "human";
}
