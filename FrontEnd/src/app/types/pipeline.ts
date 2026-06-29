// ── pipeline.ts ──────────────────────────────────────────────────────────────
// Single source of truth for all AI pipeline types.
// Import from here in every page instead of redefining locally.

import type {
  ClassificationProvenance,
  ImpactAssessmentProvenance,
  RCAProvenance,
  CAPAProvenance,
} from "./dataProvenance";

// ── Primitives ────────────────────────────────────────────────────────────────

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

// ── Impact ────────────────────────────────────────────────────────────────────

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

// ── Stage results ─────────────────────────────────────────────────────────────

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

// ── Stage wrappers (raw API shape) ────────────────────────────────────────────

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

// ── Full pipeline result ──────────────────────────────────────────────────────

export interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: HaltedStage | null;
  stages: {
    classification?: ClassificationStage;
    impactAssessment?: ImpactAssessmentStage;
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
  };
}

// ── API response shapes (subset of PipelineResult returned per endpoint) ──────

export interface ImpactAssessmentApiResponse extends Pick<
  PipelineResult,
  "status" | "haltedAt" | "auditTrail" | "query"
> {
  stages: { impactAssessment?: ImpactAssessmentStage };
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
