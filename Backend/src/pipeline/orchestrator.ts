import { runClassificationStage, type ClassificationStageResult } from "./classify.js";
import { runRCAStage, type RCAStageResult } from "./rca.js";
import { runCAPAStage, type CAPAStageResult } from "./capa.js";
import { evaluateGate, type GateResult } from "./confidenceGate.js";
import { createAuditTrail, type AuditEntry } from "../utils/auditLogger.js";

export type PipelineStatus = "halted_for_human_review" | "completed_pending_human_review";

export type HaltedStage = "classification" | "rca" | "capa" | null;

export interface PipelineStages {
  classification?: ClassificationStageResult & { gate: GateResult };
  rca?: RCAStageResult & { gate: GateResult };
  capa?: CAPAStageResult & { gate: GateResult };
}

export interface PipelineResult {
  status: PipelineStatus;
  haltedAt: HaltedStage;
  stages: PipelineStages;
  auditTrail: AuditEntry[];
}

export async function runDeviationPipeline(
  query: string,
  contextText: string
): Promise<PipelineResult> {
  const audit = createAuditTrail();
  const stages: PipelineStages = {};

  // ---- Stage 1: Classification ----
  const classificationResult = await runClassificationStage(query, contextText);
  const classificationGate = evaluateGate(
    "classification",
    classificationResult.parsed,
    classificationResult.error
  );
  stages.classification = { ...classificationResult, gate: classificationGate };
  audit.record({ ...classificationGate });

  if (!classificationGate.passed) {
    return finalize("halted_for_human_review", "classification", stages, audit.all());
  }

  // ---- Stage 2: RCA ----
  const rcaResult = await runRCAStage(query, contextText, classificationResult.parsed);
  const rcaGate = evaluateGate("rca", rcaResult.parsed, rcaResult.error);
  stages.rca = { ...rcaResult, gate: rcaGate };
  audit.record({ ...rcaGate });

  if (!rcaGate.passed) {
    return finalize("halted_for_human_review", "rca", stages, audit.all());
  }

  // ---- Stage 3: CAPA ----
  const capaResult = await runCAPAStage(query, rcaResult.parsed);
  const capaGate = evaluateGate("capa", capaResult.parsed, capaResult.error);
  stages.capa = { ...capaResult, gate: capaGate };
  audit.record({ ...capaGate });

  if (!capaGate.passed) {
    return finalize("halted_for_human_review", "capa", stages, audit.all());
  }

  // Even a fully-passed chain is advisory only — never auto-approved/closed.
  return finalize("completed_pending_human_review", null, stages, audit.all());
}

function finalize(
  status: PipelineStatus,
  haltedAt: HaltedStage,
  stages: PipelineStages,
  auditTrail: AuditEntry[]
): PipelineResult {
  return {
    status,
    haltedAt,
    stages,
    auditTrail,
  };
}
