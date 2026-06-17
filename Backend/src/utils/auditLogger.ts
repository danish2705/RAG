export interface AuditEntry {
  timestamp: string;
  [key: string]: unknown;
}

export interface AuditTrail {
  record(entry: Record<string, unknown>): void;
  all(): AuditEntry[];
}

/**
 * Minimal audit trail recorder for one pipeline run.
 * Captures every stage's gate decision so a reviewer can reconstruct why
 * the chain stopped where it did. This is a starting point, not a full
 * HITL-09 implementation — see README "What's not covered yet".
 */
export function createAuditTrail(): AuditTrail {
  const entries: AuditEntry[] = [];

  return {
    record(entry: Record<string, unknown>): void {
      entries.push({
        timestamp: new Date().toISOString(),
        ...entry,
      });
    },
    all(): AuditEntry[] {
      return entries;
    },
  };
}
