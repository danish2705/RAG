import type { ValidationTestingParsed } from "../types/pipeline";

// Change Control — Validation & Testing Strategy field labels
export const VALIDATION_TESTING_FIELD_LABELS = {
  required_validation_level: "Required Validation Level",
  scenario_based_testing: "Scenario-Based Testing Recommendations",
  regression_scope: "Regression Scope",
  uat_requirements: "UAT Requirements",
  traceability: "Traceability to Requirements / Procedures",
} as const;

/**
 * Local fallback used while the backend endpoint for this stage doesn't
 * exist yet — see the "TEMPORARY HACK FOR CHANGE CONTROL" block in
 * utils/api.ts. Mirrors the shape the real API is expected to return.
 */
export const MOCK_VALIDATION_TESTING: ValidationTestingParsed = {
  required_validation_level: {
    level: "Partial",
    rationale:
      "The change affects a moderate-risk, GxP-relevant system without altering its core validated architecture, so a partial validation covering the modified functionality and its immediate dependencies is warranted.",
  },
  scenario_based_testing: [
    "Verify the modified workflow produces the expected output for standard, in-range inputs",
    "Verify boundary and edge-case inputs are handled and rejected/flagged as expected",
    "Verify existing user roles and permissions are unaffected by the change",
    "Verify audit trail entries are generated correctly for actions in the modified area",
  ],
  regression_scope: [
    "Upstream data intake / input query workflow",
    "Downstream reporting and dashboard aggregations that consume the affected data",
    "Existing role-based access control across affected pages",
    "Integration points with dependent systems identified in the Change Impact Assessment",
  ],
  uat_requirements: [
    "Business/process owner sign-off on representative real-world scenarios",
    "QA review and approval of UAT test scripts prior to execution",
    "UAT executed in a validated test environment mirroring production configuration",
    "Documented evidence (screenshots/logs) retained for each UAT scenario",
  ],
  traceability: [
    "Link test scenarios to the requirements captured in the Change Impact Assessment",
    "Map regression scope items to the applicable SOP / Work Instruction references",
    "Maintain a requirements-to-test-case traceability matrix as part of the change record",
  ],
  confidence_score: 85,
};