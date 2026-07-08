import { runClassificationStage, } from "./classify.js";
import { runImpactAssessmentStage, } from "./impactAssessment.js";
import { runRCAStage } from "./rca.js";
import { runCAPAStage } from "./capa.js";
import { evaluateGate } from "../confidenceGate.js";
import { createAuditTrail } from "../../utils/auditLogger.js";
/**
 * Stage 1 ONLY: classification/routing. This is the entire job of
 * POST /api/inputQuery. It does NOT run impact assessment, RCA, or CAPA —
 * those each require a separate human approval step in the frontend before
 * their corresponding endpoint is even called. This is the fix for the
 * "everything runs together" bug: each exported function here is one LLM
 * round trip, gated, and returned to the frontend for a human decision
 * before the next function is ever invoked.
 */
export async function runClassificationOnly(query, contextText) {
    const audit = createAuditTrail();
    const stages = {};
    const classificationResult = await runClassificationStage(query, contextText);
    const classificationGate = evaluateGate("classification", classificationResult.parsed, classificationResult.error);
    stages.classification = { ...classificationResult, gate: classificationGate };
    audit.record({ ...classificationGate });
    if (!classificationGate.passed) {
        return finalize("halted_for_human_review", "classification", stages, audit.all());
    }
    // Classification passed its gate. The pipeline stops HERE and returns to
    // the human reviewer. Impact assessment has not run yet and will not run
    // until the reviewer accepts/overrides via the impact-assessment endpoint.
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 2 ONLY: impact/severity assessment. Call this only after a human
 * has accepted or overridden the Stage 1 classification — never
 * automatically and never in the same request as runClassificationOnly().
 *
 * `approvedClassification` is the classification the human confirmed
 * (identical to what Stage 1 returned, unless they overrode it — in which
 * case the frontend should send the overridden values).
 */
export async function runImpactAssessmentOnly(query, contextText, approvedClassification) {
    const audit = createAuditTrail();
    const stages = {};
    const impactResult = await runImpactAssessmentStage(query, contextText, approvedClassification);
    const impactGate = evaluateGate("rca", impactResult.parsed, impactResult.error);
    // NOTE: evaluateGate's StageName union doesn't include "impact_assessment"
    // yet (see confidenceGate.ts) — using "rca"'s generic confidence-only path
    // is safe since impact assessment has no classification/evidence checks,
    // but rename this once confidenceGate.ts grows an "impact_assessment" case.
    stages.impactAssessment = { ...impactResult, gate: impactGate };
    audit.record({ ...impactGate });
    if (!impactGate.passed) {
        return finalize("halted_for_human_review", "impact_assessment", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 3 ONLY: root cause analysis. Call only after impact assessment has
 * been accepted/overridden by a human.
 *
 * `approvedImpactAssessment` is the Stage 2 result the human confirmed
 * (identical to what Stage 2 returned, unless they overrode it — in which
 * case the frontend should send the overridden values). RCA is passed the
 * FULL upstream chain (classification + impact assessment), not just the
 * immediately-previous stage, so investigation depth scales with severity.
 */
export async function runRCAOnly(query, contextText, approvedClassification, approvedImpactAssessment) {
    const audit = createAuditTrail();
    const stages = {};
    const rcaResult = await runRCAStage(query, contextText, approvedClassification, approvedImpactAssessment);
    const rcaGate = evaluateGate("rca", rcaResult.parsed, rcaResult.error);
    stages.rca = { ...rcaResult, gate: rcaGate };
    audit.record({ ...rcaGate });
    if (!rcaGate.passed) {
        return finalize("halted_for_human_review", "rca", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 4 ONLY: CAPA recommendations. Call only after RCA has been
 * accepted/overridden by a human. Even a fully-passed chain is advisory
 * only — never auto-approved/closed.
 *
 * Receives the FULL approved chain — classification, impact assessment,
 * and RCA — not just RCA alone, so recommended actions can be sized to
 * severity and traced back to the specific root cause.
 */
export async function runCAPAOnly(query, approvedClassification, approvedImpactAssessment, approvedRCA) {
    const audit = createAuditTrail();
    const stages = {};
    const capaResult = await runCAPAStage(query, approvedClassification, approvedImpactAssessment, approvedRCA);
    const capaGate = evaluateGate("capa", capaResult.parsed, capaResult.error);
    stages.capa = { ...capaResult, gate: capaGate };
    audit.record({ ...capaGate });
    if (!capaGate.passed) {
        return finalize("halted_for_human_review", "capa", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
function finalize(status, haltedAt, stages, auditTrail) {
    return {
        status,
        haltedAt,
        stages,
        auditTrail,
    };
}
//# sourceMappingURL=orchestrator.js.map