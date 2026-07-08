import type {
  ClassificationProvenance,
  ImpactAssessmentProvenance,
  RCAProvenance,
  CAPAProvenance,
  ChangeImpactAssessmentProvenance,
  RiskCriticalityProvenance,
} from "./dataProvenance";

// Primitives
export type StageName = "classification" | "rca" | "capa";
export type HaltedStage = StageName | "impact_assessment";

export type GateReasonCode =
  | "invalid_output"
  | "missing_confidence_score"
  | "low_confidence"
  | "blocking_classification"
  | "insufficient_evidence";

export interface GateReason {
  code: GateReasonCode;
  detail: string | null;
}

export interface GateResult {
  stage: StageName;
  passed: boolean;
  reasons: GateReason[];
  routedTo: "manual_review_queue" | null;
}

// Impact
export type ImpactSeverity = "None" | "Minor" | "Major" | "Critical";

export interface ImpactParameter {
  severity: ImpactSeverity;
  rationale: string;
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

// Change Control
export type RiskLevel = "Low" | "Moderate" | "High";

export interface ChangeImpactAssessmentParsed {
  impacted_systems_processes_studies: string[];
  gxp_classification: "Direct" | "Indirect";
  validated_state_affected: boolean;
  data_validation_impact_rationale: string;
  downstream_dependencies: string[];
  risk_scoring: RiskLevel;
  rationale: string[];
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

// Stage results
export type ClassificationType = "Deviation" | "Change Control" | "Hybrid";

export interface ClassificationParsed {
  classification: ClassificationType;
  rationale: string[];
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

// Stage wrappers (raw API shape)
export interface StageWrapper<T> {
  rawText: string;
  parsed: T | null;
  error: unknown;
  gate: GateResult;
}

export type ClassificationStage = StageWrapper<ClassificationParsed>;
export type ImpactAssessmentStage = StageWrapper<ImpactAssessmentParsed>;
export type RCAStage = StageWrapper<RCAResult>;
export type CAPAStage = StageWrapper<CAPAResult>;
export type ChangeImpactAssessmentStage =
  StageWrapper<ChangeImpactAssessmentParsed>;
export type RiskCriticalityStage = StageWrapper<RiskCriticalityParsed>;

// Full pipeline result
export interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: HaltedStage | null;
  stages: {
    classification?: ClassificationStage;
    impactAssessment?: ImpactAssessmentStage;
    rca?: RCAStage;
    capa?: CAPAStage;
    changeImpactAssessment?: ChangeImpactAssessmentStage;
    riskCriticality?: RiskCriticalityStage;
    // Stage 3+ aren't fully modeled on the frontend yet — kept loose here so
    // this page can hand the raw stage payload off to the next page without
    // needing to know its shape.
    validationTesting?: StageWrapper<Record<string, unknown>>;
  };
  auditTrail: GateResult[];
  query: string;
  routing?: unknown;
  correction?: string;
  provenance?: {
    classification?: ClassificationProvenance;
    impactAssessment?: ImpactAssessmentProvenance;
    rca?: RCAProvenance;
    capa?: CAPAProvenance;
    changeImpactAssessment?: ChangeImpactAssessmentProvenance;
    riskCriticality?: RiskCriticalityProvenance;
  };
}

// API response shapes (subset of PipelineResult returned per endpoint)
export interface ImpactAssessmentApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { impactAssessment?: ImpactAssessmentStage };
}

export interface ChangeImpactAssessmentApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { changeImpactAssessment?: ChangeImpactAssessmentStage };
}

export interface RCAApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { rca?: RCAStage };
}

export interface CAPAApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { capa?: CAPAStage };
}

export interface RiskCriticalityApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { riskCriticality?: RiskCriticalityStage };
}

// Stage 3 (Validation & Testing) response shape — only the fields this page
// needs to know about in order to hand off and navigate forward.
export interface ValidationTestingApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { validationTesting?: StageWrapper<Record<string, unknown>> };
}