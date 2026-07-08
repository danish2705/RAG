import type {
  ClassificationProvenance,
  ImpactAssessmentProvenance,
  ChangeImpactAssessmentProvenance,
  RCAProvenance,
  CAPAProvenance,
  RiskCriticalityProvenance,
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
  | "insufficient_evidence"
  | "insufficient_input";

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
// NOTE: Backend's ChangeImpactAssessmentSchema (llm/schemas/changeControl.ts)
// only allows "Direct" | "Indirect" — there is no "No Impact" value on the
// wire. Kept in sync here intentionally; don't add "No Impact" back without
// also updating the backend schema + prompt.
export type GxpClassification = "Direct Impact" | "Indirect Impact";
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

// Change Control — stage 2: Risk & Criticality Evaluation
// NOTE: kept in exact 1:1 sync with backend's RiskCriticalitySchema
// (llm/schemas/changeControl.ts) — unlike Stage 1, the backend already
// returns nested {level, rationale} per category here, so there is no
// flat/nested adapter needed for this stage.
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
export type ClassificationType = "Deviation" | "Change Control";

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

export type ClassificationStage = StageWrapper<ClassificationParsed> & {
  /**
   * Set only when the classification LLM call decided the submission
   * itself was too vague/contradictory/off-topic to classify (STEP 1 of
   * the prompt). This is a valid, expected outcome, distinct from `error` —
   * check this BEFORE treating a null `parsed` as "no result at all".
   */
  insufficientInput?: { insufficient_input: true; reason: string } | null;
};
export type ImpactAssessmentStage = StageWrapper<ImpactAssessmentParsed>;
export type ChangeImpactAssessmentStage =
  StageWrapper<ChangeImpactAssessmentParsed>;
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
    // Stage 3 isn't fully modeled on the frontend yet — kept loose so the
    // Risk & Criticality page can hand its raw payload off without needing
    // to know the shape ValidationTesting.tsx will eventually expect.
    validationTesting?: StageWrapper<Record<string, unknown>>;
  };
  auditTrail: GateResult[];
  query: string;
  routing?: unknown;
  correction?: string;
  provenance?: {
    classification?: ClassificationProvenance;
    impactAssessment?: ImpactAssessmentProvenance;
    changeImpactAssessment?: ChangeImpactAssessmentProvenance;
    rca?: RCAProvenance;
    capa?: CAPAProvenance;
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

/** Change Control classification routes here instead of ImpactAssessmentApiResponse —
 * returns both the shared severity assessment and the Change Control–specific
 * stage 1 (Change Impact Assessment) content. */
export interface ChangeImpactAssessmentApiResponse extends Pick<
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

/** Change Control — stage 2: Risk & Criticality Evaluation */
export interface RiskCriticalityApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { riskCriticality?: RiskCriticalityStage };
}

/** Change Control — stage 3: Validation & Testing Strategy */
export interface ValidationTestingApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { validationTesting?: StageWrapper<Record<string, unknown>> };
}