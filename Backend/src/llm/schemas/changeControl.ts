import { z } from "zod";

const RiskLevel = z.enum(["Low", "Moderate", "High"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

// Stage 1: Change Impact Assessment
export const ChangeImpactAssessmentSchema = z.object({
  impacted_systems_processes_studies: z.array(z.string().min(1)).min(1),
  gxp_classification: z.enum(["Direct", "Indirect"]),
  validated_state_affected: z.boolean(),
  data_validation_impact_rationale: z.string().min(1),
  downstream_dependencies: z.array(z.string()),
  risk_scoring: RiskLevel,
  rationale: z.array(z.string().min(1)).min(1),
  confidence_score: z.number().min(0).max(100),
});
export type ChangeImpactAssessmentResult = z.infer<
  typeof ChangeImpactAssessmentSchema
>;

// Stage 2: Risk & Criticality Evaluation
export const RiskCriticalitySchema = z.object({
  patient_safety_product_quality_impact: z.object({
    level: RiskLevel,
    rationale: z.string().min(1),
  }),
  regulatory_impact: z.object({
    level: RiskLevel,
    filings_or_submissions_affected: z.array(z.string()),
    rationale: z.string().min(1),
  }),
  data_integrity_risk: z.object({
    level: RiskLevel,
    rationale: z.string().min(1),
  }),
  operational_disruption_risk: z.object({
    level: RiskLevel,
    rationale: z.string().min(1),
  }),
  risk_ranking_justification: z.string().min(1),
  confidence_score: z.number().min(0).max(100),
});
export type RiskCriticalityResult = z.infer<typeof RiskCriticalitySchema>;

// Stage 3: Validation & Testing Strategy
export const ValidationTestingSchema = z.object({
  required_validation_level: z.enum(["None", "Partial", "Full"]),
  validation_level_rationale: z.string().min(1),
  scenario_based_testing_recommendations: z.array(z.string().min(1)),
  regression_scope: z.array(z.string()),
  uat_requirements: z.array(z.string()),
  traceability_to_requirements_procedures: z.array(z.string()),
  confidence_score: z.number().min(0).max(100),
});
export type ValidationTestingResult = z.infer<typeof ValidationTestingSchema>;

// Stage 4: Implementation & Control Actions
export const ImplementationControlSchema = z.object({
  required_actions: z.array(z.string().min(1)).min(1),
  sop_wi_updates: z.array(z.string()),
  approval_routing: z.array(z.string().min(1)).min(1),
  implementation_plan_timeline: z.string().min(1),
  rollback_contingency_plan: z.string().min(1),
  confidence_score: z.number().min(0).max(100),
});
export type ImplementationControlResult = z.infer<
  typeof ImplementationControlSchema
>;

// Stage 5: Final Change Control Summary
export const FinalChangeControlSummarySchema = z.object({
  impact_assessment_summary: z.string().min(1),
  risk_classification_justification: z.string().min(1),
  validation_strategy_summary: z.string().min(1),
  required_controls_checklist: z.object({
    explainability_and_transparency: z.array(z.string()),
    data_integrity_controls: z.array(z.string()),
  }),
  final_recommendation: z.enum(["Approve", "Reject", "Conditional"]),
  residual_risk_statement: z.string().min(1),
  confidence_score: z.number().min(0).max(100),
});
export type FinalChangeControlSummaryResult = z.infer<
  typeof FinalChangeControlSummarySchema
>;
