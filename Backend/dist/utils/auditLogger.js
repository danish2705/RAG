/**
 * Minimal audit trail recorder for one pipeline run.
 * Captures every stage's gate decision so a reviewer can reconstruct why
 * the chain stopped where it did. This is a starting point, not a full
 * HITL-09 implementation — see README "What's not covered yet".
 */
export function createAuditTrail() {
    const entries = [];
    return {
        record(entry) {
            entries.push({
                timestamp: new Date().toISOString(),
                ...entry,
            });
        },
        all() {
            return entries;
        },
    };
}
//# sourceMappingURL=auditLogger.js.map