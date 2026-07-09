import type {
  ValidationLevel,
  ValidationTestingParsed,
  ImplementationControlParsed,
  ChangeControlSummaryParsed,
  ControlChecklistItem,
  FinalRecommendation,
  RiskCriticalityParsed,
  RiskLevel,
} from "../app/types/pipeline";

/**
 * Adapters between the flat shapes the backend LLM stages actually return
 * (backend/llm/schemas/changeControl.ts is the source of truth) and the
 * nested shapes the Change Control UI is built around. Mirrors the
 * flat/nested pattern already used for Stage 1 in changeImpactAdapter.ts.
 * Keep in sync with the backend schema if either side changes.
 */

// ── Stage 3: Validation & Testing Strategy ─────────────────────────────

export interface FlatValidationTesting {
  required_validation_level: ValidationLevel;
  validation_level_rationale: string;
  scenario_based_testing_recommendations: string[];
  regression_scope: string[];
  uat_requirements: string[];
  traceability_to_requirements_procedures: string[];
  confidence_score: number;
}

export function flatToNestedValidationTesting(
  flat: FlatValidationTesting,
): ValidationTestingParsed {
  return {
    required_validation_level: {
      level: flat.required_validation_level,
      rationale: flat.validation_level_rationale,
    },
    scenario_based_testing: flat.scenario_based_testing_recommendations,
    regression_scope: flat.regression_scope,
    uat_requirements: flat.uat_requirements,
    traceability: flat.traceability_to_requirements_procedures,
    confidence_score: flat.confidence_score,
  };
}

export function nestedToFlatValidationTesting(
  nested: ValidationTestingParsed,
): FlatValidationTesting {
  return {
    required_validation_level: nested.required_validation_level.level,
    validation_level_rationale: nested.required_validation_level.rationale,
    scenario_based_testing_recommendations: nested.scenario_based_testing,
    regression_scope: nested.regression_scope,
    uat_requirements: nested.uat_requirements,
    traceability_to_requirements_procedures: nested.traceability,
    confidence_score: nested.confidence_score,
  };
}

// ── Stage 4: Implementation & Control Actions ───────────────────────────

export interface FlatImplementationControl {
  required_actions: string[];
  sop_wi_updates: string[];
  approval_routing: string[];
  implementation_plan_timeline: string;
  rollback_contingency_plan: string;
  confidence_score: number;
}

export function flatToNestedImplementationControl(
  flat: FlatImplementationControl,
): ImplementationControlParsed {
  return {
    required_actions: flat.required_actions,
    sop_wi_updates: flat.sop_wi_updates,
    approval_routing: flat.approval_routing,
    implementation_plan: flat.implementation_plan_timeline,
    rollback_contingency_plan: flat.rollback_contingency_plan,
    confidence_score: flat.confidence_score,
  };
}

export function nestedToFlatImplementationControl(
  nested: ImplementationControlParsed,
): FlatImplementationControl {
  return {
    required_actions: nested.required_actions,
    sop_wi_updates: nested.sop_wi_updates,
    approval_routing: nested.approval_routing,
    implementation_plan_timeline: nested.implementation_plan,
    rollback_contingency_plan: nested.rollback_contingency_plan,
    confidence_score: nested.confidence_score,
  };
}

// ── Stage 5: Final Change Control Summary ───────────────────────────────

export interface FlatChangeControlSummary {
  impact_assessment_summary: string;
  risk_classification_justification: string;
  validation_strategy_summary: string;
  required_controls_checklist: {
    explainability_and_transparency: string[];
    data_integrity_controls: string[];
  };
  final_recommendation: FinalRecommendation;
  residual_risk_statement: string;
  confidence_score: number;
}

/**
 * The backend's Stage 2 (Risk & Criticality) scores four separate
 * dimensions rather than a single overall level, and the Stage 5 summary
 * schema doesn't carry its own level either — only a justification. The
 * overall level shown here is the worst ("highest risk wins") of the four
 * Stage 2 dimensions, the same rule already used for the page's "Overall
 * AI Confidence Score" risk-system-rationale label.
 */
export function deriveOverallRiskLevel(risk: RiskCriticalityParsed): RiskLevel {
  const levels: RiskLevel[] = [
    risk.patient_safety_product_quality_impact.level,
    risk.regulatory_impact.level,
    risk.data_integrity_risk.level,
    risk.operational_disruption_risk.level,
  ];
  if (levels.includes("High")) return "High";
  if (levels.includes("Moderate")) return "Moderate";
  return "Low";
}

export function flatToNestedChangeControlSummary(
  flat: FlatChangeControlSummary,
  risk: RiskCriticalityParsed,
): ChangeControlSummaryParsed {
  const checklist: ControlChecklistItem[] = [
    {
      label: "Explainability & Transparency",
      satisfied:
        flat.required_controls_checklist.explainability_and_transparency
          .length > 0,
      notes:
        flat.required_controls_checklist.explainability_and_transparency.join(
          " ",
        ),
    },
    {
      label: "Data Integrity Controls",
      satisfied:
        flat.required_controls_checklist.data_integrity_controls.length > 0,
      notes: flat.required_controls_checklist.data_integrity_controls.join(" "),
    },
  ];

  return {
    impact_assessment_summary: flat.impact_assessment_summary,
    risk_classification: {
      level: deriveOverallRiskLevel(risk),
      justification: flat.risk_classification_justification,
    },
    validation_strategy_summary: flat.validation_strategy_summary,
    required_controls_checklist: checklist,
    final_recommendation: flat.final_recommendation,
    residual_risk_statement: flat.residual_risk_statement,
    confidence_score: flat.confidence_score,
  };
}
