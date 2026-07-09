export interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

export interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

export interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

export interface RCAResult {
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_summary: string;
  confidence_score: number;
}

export interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

export interface DeviationCase {
  id: number;
  query: string;
  saved_by: string;
  classification: ClassificationParsed | null;
  impact_assessment: ImpactAssessmentParsed | null;
  rca: RCAResult | null;
  capa: CAPAResult | null;
  status: string;
  created_at: string;
}

// --- Change Control ---

export type GxpClassification = "Direct Impact" | "Indirect Impact";
export type RiskLevel = "Low" | "Moderate" | "High";
export type ValidationLevel = "None" | "Partial" | "Full";

export interface ChangeImpactAssessmentParsed {
  impacted_systems: string[];
  gxp_classification: { value: GxpClassification; rationale: string };
  data_validation_impact: {
    validated_state_affected: boolean;
    rationale: string;
  };
  downstream_dependencies: string[];
  risk_scoring: { level: RiskLevel; rationale: string };
  confidence_score: number;
}

export interface RiskRatingParsed {
  level: RiskLevel;
  rationale: string;
}

export interface RegulatoryImpactParsed {
  level: RiskLevel;
  filings_or_submissions_affected: string[];
  rationale: string;
}

export interface RiskCriticalityParsed {
  patient_safety_product_quality_impact: RiskRatingParsed;
  regulatory_impact: RegulatoryImpactParsed;
  data_integrity_risk: RiskRatingParsed;
  operational_disruption_risk: RiskRatingParsed;
  risk_ranking_justification: string;
  confidence_score: number;
}

export interface ValidationTestingParsed {
  required_validation_level: { level: ValidationLevel; rationale: string };
  scenario_based_testing: string[];
  regression_scope: string[];
  uat_requirements: string[];
  traceability: string[];
  confidence_score: number;
}

export interface ImplementationControlParsed {
  required_actions: string[];
  sop_wi_updates: string[];
  approval_routing: string[];
  implementation_plan: string;
  rollback_contingency_plan: string;
  confidence_score: number;
}

export interface ChangeControlCase {
  id: number;
  query: string;
  saved_by: string;
  classification: ClassificationParsed | null;
  change_impact_assessment: ChangeImpactAssessmentParsed | null;
  risk_criticality: RiskCriticalityParsed | null;
  validation_testing: ValidationTestingParsed | null;
  implementation_control: ImplementationControlParsed | null;
  final_summary: unknown | null;
  status: string;
  created_at: string;
}

export type AnyCase =
  | (DeviationCase & { case_type: "Deviation" })
  | (ChangeControlCase & { case_type: "Change Control" });
