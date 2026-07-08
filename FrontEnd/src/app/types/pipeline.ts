import type {
  ClassificationProvenance,
  ImpactAssessmentProvenance,
  RCAProvenance,
  CAPAProvenance,
  // NEW: You may need to add this to your dataProvenance file eventually
  // RiskCriticalityProvenance, 
} from "./dataProvenance";

// Primitives 
// NEW: Added risk_criticality to StageName if you plan to use gates for it
export type StageName = "classification" | "rca" | "capa" | "risk_criticality"; 
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

// Change Control — stage 1: Change Impact Assessment
export type GxpClassification = "Direct Impact" | "Indirect Impact" | "No Impact";
export type RiskLevel = "Low" | "Moderate" | "High";

export interface ChangeImpactAssessmentParsed {
  /** Impacted systems / processes / studies */
  impacted_systems: string[];
  gxp_classification: {
    value: GxpClassification;
    rationale: string;
  };
  /** Data & validation impact — was the validated state affected? */
  data_validation_impact: {
    validated_state_affected: boolean;
    rationale: string;
  };
  /** Downstream dependencies — interfaces, reports, integrations */
  downstream_dependencies: string[];
  risk_scoring: {
    level: RiskLevel;
    rationale: string;
  };
  confidence_score: number;
}

// NEW: Change Control — stage 2: Risk & Criticality Evaluation
export interface RiskCriticalityParsed {
  patient_safety_impact: string;
  regulatory_impact: string;
  data_integrity_risk: string;
  operational_disruption_risk: string;
  risk_ranking: {
    level: RiskLevel;
    justification: string;
  };
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
  impact_summary: string;
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_assessment: string;
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
export type ChangeImpactAssessmentStage = StageWrapper<ChangeImpactAssessmentParsed>;
// NEW: Added StageWrapper for RiskCriticality
export type RiskCriticalityStage = StageWrapper<RiskCriticalityParsed>; 
export type RCAStage = StageWrapper<RCAResult>;
export type CAPAStage = StageWrapper<CAPAResult>;

// Full pipeline result 
export interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: HaltedStage | null;
  stages: {
    classification?: ClassificationStage;
    impactAssessment?: ImpactAssessmentStage;
    /** Change Control only — stage 1: Change Impact Assessment */
    changeImpactAssessment?: ChangeImpactAssessmentStage;
    
    // NEW: Added riskCriticality to the stages object to fix the TS(2339) error
    /** Change Control only — stage 2: Risk & Criticality Evaluation */
    riskCriticality?: RiskCriticalityStage; 
    
    rca?: RCAStage;
    capa?: CAPAStage;
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
    // NEW: If you use data provenance here, add this line too
    // riskCriticality?: RiskCriticalityProvenance; 
  };
}

// API response shapes (subset of PipelineResult returned per endpoint) 
export interface ImpactAssessmentApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { impactAssessment?: ImpactAssessmentStage };
}

/** Change Control classification routes here instead of ImpactAssessmentApiResponse —
 * returns both the shared severity assessment and the Change Control–specific
 * stage 1 (Change Impact Assessment) content. */
export interface ChangeControlImpactAssessmentApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: {
    impactAssessment?: ImpactAssessmentStage;
    changeImpactAssessment?: ChangeImpactAssessmentStage;
  };
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