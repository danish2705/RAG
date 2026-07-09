import type { ImplementationControlParsed } from "../types/pipeline";

// Change Control — Implementation & Control Actions field labels
export const IMPLEMENTATION_CONTROL_FIELD_LABELS = {
  required_actions: "Required Actions",
  sop_wi_updates: "SOP / WI Updates Required",
  approval_routing: "Approval Routing",
  implementation_plan: "Implementation Plan + Timeline",
  rollback_contingency_plan: "Rollback / Contingency Plan",
} as const;

/**
 * Local fallback used while the backend endpoint for this stage doesn't
 * exist yet — see the "TEMPORARY HACK FOR CHANGE CONTROL" block in
 * utils/api.ts. Mirrors the shape the real API is expected to return.
 */
export const MOCK_IMPLEMENTATION_CONTROL: ImplementationControlParsed = {
  required_actions: [
    "Update system configuration to reflect the approved change",
    "Update associated documentation (SOPs, work instructions, diagrams)",
    "Deliver training to affected personnel prior to go-live",
  ],
  sop_wi_updates: [
    "Revise SOP-QA-014 (Change Control Procedure) references",
    "Update WI-IT-102 (System Configuration Work Instruction)",
  ],
  approval_routing: [
    "QA Manager",
    "System Owner",
    "IT/Validation Lead",
    "Department Head (affected area)",
  ],
  implementation_plan:
    "Implementation will occur in a scheduled maintenance window. Configuration changes are applied first in the validated test environment, followed by UAT sign-off, then promoted to production. Estimated timeline: 2 weeks from approval to go-live, including a 3-day hypercare period post-implementation.",
  rollback_contingency_plan:
    "If critical issues are identified post-implementation, the prior validated configuration will be restored from backup within a 4-hour window. A rollback decision will be made jointly by QA and the System Owner, and documented in the change record.",
  confidence_score: 85,
};