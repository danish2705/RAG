import { z } from "zod";
declare const RiskLevel: z.ZodEnum<["Low", "Moderate", "High"]>;
export type RiskLevel = z.infer<typeof RiskLevel>;
export declare const ChangeImpactAssessmentSchema: z.ZodObject<{
    impacted_systems_processes_studies: z.ZodArray<z.ZodString, "many">;
    gxp_classification: z.ZodEnum<["Direct", "Indirect"]>;
    validated_state_affected: z.ZodBoolean;
    data_validation_impact_rationale: z.ZodString;
    downstream_dependencies: z.ZodArray<z.ZodString, "many">;
    risk_scoring: z.ZodEnum<["Low", "Moderate", "High"]>;
    rationale: z.ZodArray<z.ZodString, "many">;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    rationale: string[];
    confidence_score: number;
    impacted_systems_processes_studies: string[];
    gxp_classification: "Direct" | "Indirect";
    validated_state_affected: boolean;
    data_validation_impact_rationale: string;
    downstream_dependencies: string[];
    risk_scoring: "Low" | "Moderate" | "High";
}, {
    rationale: string[];
    confidence_score: number;
    impacted_systems_processes_studies: string[];
    gxp_classification: "Direct" | "Indirect";
    validated_state_affected: boolean;
    data_validation_impact_rationale: string;
    downstream_dependencies: string[];
    risk_scoring: "Low" | "Moderate" | "High";
}>;
export type ChangeImpactAssessmentResult = z.infer<typeof ChangeImpactAssessmentSchema>;
export declare const RiskCriticalitySchema: z.ZodObject<{
    patient_safety_product_quality_impact: z.ZodObject<{
        level: z.ZodEnum<["Low", "Moderate", "High"]>;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }>;
    regulatory_impact: z.ZodObject<{
        level: z.ZodEnum<["Low", "Moderate", "High"]>;
        filings_or_submissions_affected: z.ZodArray<z.ZodString, "many">;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
        filings_or_submissions_affected: string[];
    }, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
        filings_or_submissions_affected: string[];
    }>;
    data_integrity_risk: z.ZodObject<{
        level: z.ZodEnum<["Low", "Moderate", "High"]>;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }>;
    operational_disruption_risk: z.ZodObject<{
        level: z.ZodEnum<["Low", "Moderate", "High"]>;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }, {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    }>;
    risk_ranking_justification: z.ZodString;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    patient_safety_product_quality_impact: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    regulatory_impact: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
        filings_or_submissions_affected: string[];
    };
    data_integrity_risk: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    operational_disruption_risk: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    risk_ranking_justification: string;
}, {
    confidence_score: number;
    patient_safety_product_quality_impact: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    regulatory_impact: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
        filings_or_submissions_affected: string[];
    };
    data_integrity_risk: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    operational_disruption_risk: {
        rationale: string;
        level: "Low" | "Moderate" | "High";
    };
    risk_ranking_justification: string;
}>;
export type RiskCriticalityResult = z.infer<typeof RiskCriticalitySchema>;
export declare const ValidationTestingSchema: z.ZodObject<{
    required_validation_level: z.ZodEnum<["None", "Partial", "Full"]>;
    validation_level_rationale: z.ZodString;
    scenario_based_testing_recommendations: z.ZodArray<z.ZodString, "many">;
    regression_scope: z.ZodArray<z.ZodString, "many">;
    uat_requirements: z.ZodArray<z.ZodString, "many">;
    traceability_to_requirements_procedures: z.ZodArray<z.ZodString, "many">;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    required_validation_level: "None" | "Partial" | "Full";
    validation_level_rationale: string;
    scenario_based_testing_recommendations: string[];
    regression_scope: string[];
    uat_requirements: string[];
    traceability_to_requirements_procedures: string[];
}, {
    confidence_score: number;
    required_validation_level: "None" | "Partial" | "Full";
    validation_level_rationale: string;
    scenario_based_testing_recommendations: string[];
    regression_scope: string[];
    uat_requirements: string[];
    traceability_to_requirements_procedures: string[];
}>;
export type ValidationTestingResult = z.infer<typeof ValidationTestingSchema>;
export declare const ImplementationControlSchema: z.ZodObject<{
    required_actions: z.ZodArray<z.ZodString, "many">;
    sop_wi_updates: z.ZodArray<z.ZodString, "many">;
    approval_routing: z.ZodArray<z.ZodString, "many">;
    implementation_plan_timeline: z.ZodString;
    rollback_contingency_plan: z.ZodString;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    required_actions: string[];
    sop_wi_updates: string[];
    approval_routing: string[];
    implementation_plan_timeline: string;
    rollback_contingency_plan: string;
}, {
    confidence_score: number;
    required_actions: string[];
    sop_wi_updates: string[];
    approval_routing: string[];
    implementation_plan_timeline: string;
    rollback_contingency_plan: string;
}>;
export type ImplementationControlResult = z.infer<typeof ImplementationControlSchema>;
export declare const FinalChangeControlSummarySchema: z.ZodObject<{
    impact_assessment_summary: z.ZodString;
    risk_classification_justification: z.ZodString;
    validation_strategy_summary: z.ZodString;
    required_controls_checklist: z.ZodObject<{
        explainability_and_transparency: z.ZodArray<z.ZodString, "many">;
        data_integrity_controls: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        explainability_and_transparency: string[];
        data_integrity_controls: string[];
    }, {
        explainability_and_transparency: string[];
        data_integrity_controls: string[];
    }>;
    final_recommendation: z.ZodEnum<["Approve", "Reject", "Conditional"]>;
    residual_risk_statement: z.ZodString;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    impact_assessment_summary: string;
    risk_classification_justification: string;
    validation_strategy_summary: string;
    required_controls_checklist: {
        explainability_and_transparency: string[];
        data_integrity_controls: string[];
    };
    final_recommendation: "Approve" | "Reject" | "Conditional";
    residual_risk_statement: string;
}, {
    confidence_score: number;
    impact_assessment_summary: string;
    risk_classification_justification: string;
    validation_strategy_summary: string;
    required_controls_checklist: {
        explainability_and_transparency: string[];
        data_integrity_controls: string[];
    };
    final_recommendation: "Approve" | "Reject" | "Conditional";
    residual_risk_statement: string;
}>;
export type FinalChangeControlSummaryResult = z.infer<typeof FinalChangeControlSummarySchema>;
export {};
