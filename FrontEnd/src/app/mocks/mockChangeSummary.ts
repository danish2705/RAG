import type { ChangeControlSummaryParsed } from "../types/pipeline";

// Change Control — Final Change Control Summary field labels
export const CHANGE_CONTROL_SUMMARY_FIELD_LABELS = {
  impact_assessment_summary: "Impact Assessment Summary",
  risk_classification: "Risk Classification + Justification",
  validation_strategy_summary: "Validation Strategy Summary",
  required_controls_checklist: "Required Controls Checklist",
  final_recommendation: "Final Recommendation",
  residual_risk_statement: "Residual Risk Statement",
} as const;

/**
 * Local fallback used while the backend endpoint for this stage doesn't
 * exist yet — see the "TEMPORARY HACK FOR CHANGE CONTROL" block in
 * utils/api.ts. Mirrors the shape the real API is expected to return.
 */
export const MOCK_CHANGE_CONTROL_SUMMARY: ChangeControlSummaryParsed = {
  impact_assessment_summary:
    "The change affects a GxP-direct-impact system with a moderate overall risk profile. Validated state is affected and downstream reporting dependencies were identified; no patient safety impact is expected given the scope of the change.",
  risk_classification: {
    level: "Moderate",
    justification:
      "Moderate risk reflects a direct-impact system change with a defined validation and rollback path, offset by dependencies on downstream reporting interfaces.",
  },
  validation_strategy_summary:
    "Partial validation is required, focused on scenario-based testing of the modified workflow and regression testing of downstream reporting interfaces. UAT sign-off is required prior to production promotion, with full traceability to the originating change request.",
  required_controls_checklist: [
    {
      label: "Explainability",
      satisfied: true,
      notes: "AI-assisted rationale captured at each stage with human review.",
    },
    {
      label: "Data Integrity",
      satisfied: true,
      notes: "ALCOA+ controls maintained; audit trail enabled throughout.",
    },
  ],
  final_recommendation: "Conditional",
  residual_risk_statement:
    "Residual risk is low-to-moderate, contingent on completion of UAT sign-off and confirmation that downstream reporting interfaces are unaffected post-implementation. No further mitigation is required beyond the documented rollback plan.",
  confidence_score: 85,
};