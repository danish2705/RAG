import { z } from "zod";
const RiskLevel = z.enum(["Low", "Moderate", "High"]);
// ─────────────────────────────────────────────────────────────────────────
// Stage 1: Change Impact Assessment
// (Impacted systems/processes/studies, GxP classification, data/validation
// impact, downstream dependencies, risk scoring)
// ─────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────
// Stage 2: Risk & Criticality Evaluation
// (Patient safety/product quality, regulatory impact, data integrity risk,
// operational disruption risk, risk ranking + justification)
// ─────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────
// Stage 3: Validation & Testing Strategy
// (Required validation level, scenario-based testing, regression scope,
// UAT requirements, traceability)
// ─────────────────────────────────────────────────────────────────────────
export const ValidationTestingSchema = z.object({
    required_validation_level: z.enum(["None", "Partial", "Full"]),
    validation_level_rationale: z.string().min(1),
    scenario_based_testing_recommendations: z.array(z.string().min(1)),
    regression_scope: z.array(z.string()),
    uat_requirements: z.array(z.string()),
    traceability_to_requirements_procedures: z.array(z.string()),
    confidence_score: z.number().min(0).max(100),
});
// ─────────────────────────────────────────────────────────────────────────
// Stage 4: Implementation & Control Actions
// (Required actions, SOP/WI updates, approval routing, implementation
// plan/timeline, rollback/contingency plan)
// ─────────────────────────────────────────────────────────────────────────
export const ImplementationControlSchema = z.object({
    required_actions: z.array(z.string().min(1)).min(1),
    sop_wi_updates: z.array(z.string()),
    approval_routing: z.array(z.string().min(1)).min(1),
    implementation_plan_timeline: z.string().min(1),
    rollback_contingency_plan: z.string().min(1),
    confidence_score: z.number().min(0).max(100),
});
// ─────────────────────────────────────────────────────────────────────────
// Stage 5: Final Change Control Summary
// (Impact summary, risk classification + justification, validation
// strategy summary, required controls checklist, final recommendation,
// residual risk)
// ─────────────────────────────────────────────────────────────────────────
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
//# sourceMappingURL=changeControl.js.map