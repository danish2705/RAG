export interface AuditEntry {
  timestamp: string;
  user: string;
  action: string;
  type: "ai" | "human";
}