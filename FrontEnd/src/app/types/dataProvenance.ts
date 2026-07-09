export type DataSource = "ai" | "modified";

export interface DataField<T> {
  value: T;
  source: DataSource;
  /** Only present when source === "modified" */
  originalValue?: T;
  modifiedAt?: string; // ISO timestamp
}

// Stage-level provenance wrappers

export interface ClassificationProvenance {
  classification: DataField<"Deviation" | "Change Control">;
  rationale: DataField<string[]>;
  confidence_score: number;
}

export interface ImpactParameterProvenance {
  severity: DataField<"None" | "Minor" | "Major" | "Critical">;
  rationale: DataField<string>;
}

export interface ImpactAssessmentProvenance {
  impact_assessment: {
    product_impact: ImpactParameterProvenance;
    patient_impact: ImpactParameterProvenance;
    data_integrity_impact: ImpactParameterProvenance;
    compliance_impact: ImpactParameterProvenance;
  };
  confidence_score: number;
}

// Change Control — Stage 1: Change Impact Assessment
export interface ChangeImpactAssessmentProvenance {
  impacted_systems: DataField<string[]>;
  gxp_classification: {
    value: DataField<"Direct Impact" | "Indirect Impact">;
    rationale: DataField<string>;
  };
  data_validation_impact: {
    validated_state_affected: DataField<boolean>;
    rationale: DataField<string>;
  };
  downstream_dependencies: DataField<string[]>;
  risk_scoring: {
    level: DataField<"Low" | "Moderate" | "High">;
    rationale: DataField<string>;
  };
  confidence_score: number;
}

export interface RCAProvenance {
  primary_root_cause: DataField<string>;
  immediate_cause: DataField<string>;
  contributing_factors: DataField<string[]>;
  evidence: DataField<string[]>;
  sequence_of_events: string[];
  impact_summary: string;
  confidence_score: number;
}

export interface CAPAProvenance {
  capa_required: boolean;
  corrective_actions: DataField<string[]>;
  preventive_actions: DataField<string[]>;
  effectiveness_check: DataField<string>;
  due_date: DataField<string>;
  confidence_score: number;
}

// Change Control — Stage 2: Risk & Criticality Evaluation
export interface RiskRatingProvenance {
  level: DataField<"Low" | "Moderate" | "High">;
  rationale: DataField<string>;
}

export interface RegulatoryImpactProvenance {
  level: DataField<"Low" | "Moderate" | "High">;
  filings_or_submissions_affected: DataField<string[]>;
  rationale: DataField<string>;
}

export interface RiskCriticalityProvenance {
  patient_safety_product_quality_impact: RiskRatingProvenance;
  regulatory_impact: RegulatoryImpactProvenance;
  data_integrity_risk: RiskRatingProvenance;
  operational_disruption_risk: RiskRatingProvenance;
  risk_ranking_justification: DataField<string>;
  confidence_score: number;
}

// Change Control — Stage 3: Validation & Testing Strategy
export interface ValidationTestingProvenance {
  required_validation_level: {
    level: DataField<"None" | "Partial" | "Full">;
    rationale: DataField<string>;
  };
  scenario_based_testing: DataField<string[]>;
  regression_scope: DataField<string[]>;
  uat_requirements: DataField<string[]>;
  traceability: DataField<string[]>;
  confidence_score: number;
}

// Change Control — Stage 4: Implementation & Control Actions
export interface ImplementationControlProvenance {
  required_actions: DataField<string[]>;
  sop_wi_updates: DataField<string[]>;
  approval_routing: DataField<string[]>;
  implementation_plan: DataField<string>;
  rollback_contingency_plan: DataField<string>;
  confidence_score: number;
}

// Change Control — Stage 5: Final Change Control Summary
export interface ControlChecklistItemValue {
  label: string;
  satisfied: boolean;
  notes: string;
}

export interface ChangeControlSummaryProvenance {
  impact_assessment_summary: DataField<string>;
  risk_classification: {
    level: DataField<"Low" | "Moderate" | "High">;
    justification: DataField<string>;
  };
  validation_strategy_summary: DataField<string>;
  required_controls_checklist: DataField<ControlChecklistItemValue[]>;
  final_recommendation: DataField<"Approve" | "Reject" | "Conditional">;
  residual_risk_statement: DataField<string>;
  confidence_score: number;
}

// Helpers
/** Wrap a value as AI-generated */
export function aiField<T>(value: T): DataField<T> {
  return { value, source: "ai" };
}

/** Wrap a value as human-modified, carrying the original AI value */
export function modifiedField<T>(value: T, originalValue: T): DataField<T> {
  return {
    value,
    source: "modified",
    originalValue,
    modifiedAt: new Date().toISOString(),
  };
}

/** Promote an existing DataField to modified, keeping its original */
export function markModified<T>(
  field: DataField<T>,
  newValue: T,
): DataField<T> {
  const trueOriginal =
    field.source === "modified" ? field.originalValue : field.value;
  return {
    value: newValue,
    source: "modified",
    originalValue: trueOriginal,
    modifiedAt: new Date().toISOString(),
  };
}

/** Strip provenance wrappers to get a plain value object for API calls */
export function unwrapField<T>(field: DataField<T>): T {
  return field.value;
}