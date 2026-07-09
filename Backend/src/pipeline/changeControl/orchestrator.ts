import {
  runChangeImpactAssessmentStage,
  type ChangeImpactAssessmentStageResult,
} from "./impactAssessment.js";
import {
  runRiskCriticalityStage,
  type RiskCriticalityStageResult,
} from "./riskCriticality.js";
import {
  runValidationTestingStage,
  type ValidationTestingStageResult,
} from "./validationTesting.js";
import {
  runImplementationControlStage,
  type ImplementationControlStageResult,
} from "./implementationControl.js";
import {
  runFinalSummaryStage,
  type FinalSummaryStageResult,
} from "./summary.js";
import { evaluateGate, type GateResult } from "../confidenceGate.js";
import { createAuditTrail, type AuditEntry } from "../../utils/auditLogger.js";
import type { ClassificationResult } from "../../llm/schemas/deviation.js";
import type {
  ChangeImpactAssessmentResult,
  RiskCriticalityResult,
  ValidationTestingResult,
  ImplementationControlResult,
} from "../../llm/schemas/changeControl.js";

export type PipelineStatus =
  | "halted_for_human_review"
  | "completed_pending_human_review";

export type HaltedStage =
  | "change_impact_assessment"
  | "risk_criticality"
  | "validation_testing"
  | "implementation_control"
  | "final_summary"
  | null;

export interface PipelineStages {
  changeImpactAssessment?: ChangeImpactAssessmentStageResult & {
    gate: GateResult;
  };
  riskCriticality?: RiskCriticalityStageResult & { gate: GateResult };
  validationTesting?: ValidationTestingStageResult & { gate: GateResult };
  implementationControl?: ImplementationControlStageResult & {
    gate: GateResult;
  };
  changeControlSummary?: FinalSummaryStageResult & { gate: GateResult };
}

export interface PipelineResult {
  status: PipelineStatus;
  haltedAt: HaltedStage;
  stages: PipelineStages;
  auditTrail: AuditEntry[];
}

/**
 * Stage 1 ONLY: Change Impact Assessment. Call only after a human has
 * accepted/overridden the upstream (shared) "Change Control" classification.
 */
export async function runChangeImpactAssessmentOnly(
  query: string,
  contextText: string,
  approvedClassification: ClassificationResult,
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  const result = await runChangeImpactAssessmentStage(
    query,
    contextText,
    approvedClassification,
  );
  const gate = evaluateGate(
    "change_impact_assessment",
    result.parsed,
    result.error,
  );
  stages.changeImpactAssessment = { ...result, gate };
  audit.record({ ...gate });

  if (!gate.passed) {
    return finalize(
      "halted_for_human_review",
      "change_impact_assessment",
      stages,
      audit.all(),
    );
  }

  return finalize("completed_pending_human_review", null, stages, audit.all());
}

/**
 * Stage 2 ONLY: Risk & Criticality Evaluation. Call only after a human has
 * accepted/overridden Stage 1.
 */
export async function runRiskCriticalityOnly(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  const result = await runRiskCriticalityStage(query, approvedImpactAssessment);
  const gate = evaluateGate("risk_criticality", result.parsed, result.error);
  stages.riskCriticality = { ...result, gate };
  audit.record({ ...gate });

  if (!gate.passed) {
    return finalize(
      "halted_for_human_review",
      "risk_criticality",
      stages,
      audit.all(),
    );
  }

  return finalize("completed_pending_human_review", null, stages, audit.all());
}

/**
 * Stage 3 ONLY: Validation & Testing Strategy. Call only after a human has
 * accepted/overridden Stage 2.
 */
export async function runValidationTestingOnly(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  const result = await runValidationTestingStage(
    query,
    approvedImpactAssessment,
    approvedRiskCriticality,
  );
  const gate = evaluateGate("validation_testing", result.parsed, result.error);
  stages.validationTesting = { ...result, gate };
  audit.record({ ...gate });

  if (!gate.passed) {
    return finalize(
      "halted_for_human_review",
      "validation_testing",
      stages,
      audit.all(),
    );
  }

  return finalize("completed_pending_human_review", null, stages, audit.all());
}

/**
 * Stage 4 ONLY: Implementation & Control Actions. Call only after a human
 * has accepted/overridden Stage 3.
 */
export async function runImplementationControlOnly(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
  approvedValidationTesting: ValidationTestingResult,
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  const result = await runImplementationControlStage(
    query,
    approvedImpactAssessment,
    approvedRiskCriticality,
    approvedValidationTesting,
  );
  const gate = evaluateGate(
    "implementation_control",
    result.parsed,
    result.error,
  );
  stages.implementationControl = { ...result, gate };
  audit.record({ ...gate });

  if (!gate.passed) {
    return finalize(
      "halted_for_human_review",
      "implementation_control",
      stages,
      audit.all(),
    );
  }

  return finalize("completed_pending_human_review", null, stages, audit.all());
}

/**
 * Stage 5 ONLY: Final Change Control Summary. Call only after a human has
 * accepted/overridden Stage 4. Advisory only — never auto-approves.
 */
export async function runFinalSummaryOnly(
  query: string,
  approvedImpactAssessment: ChangeImpactAssessmentResult,
  approvedRiskCriticality: RiskCriticalityResult,
  approvedValidationTesting: ValidationTestingResult,
  approvedImplementationControl: ImplementationControlResult,
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  const result = await runFinalSummaryStage(
    query,
    approvedImpactAssessment,
    approvedRiskCriticality,
    approvedValidationTesting,
    approvedImplementationControl,
  );
  const gate = evaluateGate("final_summary", result.parsed, result.error);
  stages.changeControlSummary = { ...result, gate };
  audit.record({ ...gate });

  if (!gate.passed) {
    return finalize(
      "halted_for_human_review",
      "final_summary",
      stages,
      audit.all(),
    );
  }

  return finalize("completed_pending_human_review", null, stages, audit.all());
}

function finalize(
  status: PipelineStatus,
  haltedAt: HaltedStage,
  stages: PipelineStages,
  auditTrail: AuditEntry[],
): PipelineResult {
  return {
    status,
    haltedAt,
    stages,
    auditTrail,
  };
}
