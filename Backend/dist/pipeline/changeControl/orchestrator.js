import { runChangeImpactAssessmentStage, } from "./impactAssessment.js";
import { runRiskCriticalityStage, } from "./riskCriticality.js";
import { runValidationTestingStage, } from "./validationTesting.js";
import { runImplementationControlStage, } from "./implementationControl.js";
import { runFinalSummaryStage, } from "./summary.js";
import { evaluateGate } from "../confidenceGate.js";
import { createAuditTrail } from "../../utils/auditLogger.js";
/**
 * Stage 1 ONLY: Change Impact Assessment. Call only after a human has
 * accepted/overridden the upstream (shared) "Change Control" classification.
 */
export async function runChangeImpactAssessmentOnly(query, contextText, approvedClassification) {
    const audit = createAuditTrail();
    const stages = {};
    const result = await runChangeImpactAssessmentStage(query, contextText, approvedClassification);
    const gate = evaluateGate("change_impact_assessment", result.parsed, result.error);
    stages.changeImpactAssessment = { ...result, gate };
    audit.record({ ...gate });
    if (!gate.passed) {
        return finalize("halted_for_human_review", "change_impact_assessment", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 2 ONLY: Risk & Criticality Evaluation. Call only after a human has
 * accepted/overridden Stage 1.
 */
export async function runRiskCriticalityOnly(query, approvedImpactAssessment) {
    const audit = createAuditTrail();
    const stages = {};
    const result = await runRiskCriticalityStage(query, approvedImpactAssessment);
    const gate = evaluateGate("risk_criticality", result.parsed, result.error);
    stages.riskCriticality = { ...result, gate };
    audit.record({ ...gate });
    if (!gate.passed) {
        return finalize("halted_for_human_review", "risk_criticality", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 3 ONLY: Validation & Testing Strategy. Call only after a human has
 * accepted/overridden Stage 2.
 */
export async function runValidationTestingOnly(query, approvedImpactAssessment, approvedRiskCriticality) {
    const audit = createAuditTrail();
    const stages = {};
    const result = await runValidationTestingStage(query, approvedImpactAssessment, approvedRiskCriticality);
    const gate = evaluateGate("validation_testing", result.parsed, result.error);
    stages.validationTesting = { ...result, gate };
    audit.record({ ...gate });
    if (!gate.passed) {
        return finalize("halted_for_human_review", "validation_testing", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 4 ONLY: Implementation & Control Actions. Call only after a human
 * has accepted/overridden Stage 3.
 */
export async function runImplementationControlOnly(query, approvedImpactAssessment, approvedRiskCriticality, approvedValidationTesting) {
    const audit = createAuditTrail();
    const stages = {};
    const result = await runImplementationControlStage(query, approvedImpactAssessment, approvedRiskCriticality, approvedValidationTesting);
    const gate = evaluateGate("implementation_control", result.parsed, result.error);
    stages.implementationControl = { ...result, gate };
    audit.record({ ...gate });
    if (!gate.passed) {
        return finalize("halted_for_human_review", "implementation_control", stages, audit.all());
    }
    return finalize("completed_pending_human_review", null, stages, audit.all());
}
/**
 * Stage 5 ONLY: Final Change Control Summary. Call only after a human has
 * accepted/overridden Stage 4. Advisory only — never auto-approves.
 */
export async function runFinalSummaryOnly(query, approvedImpactAssessment, approvedRiskCriticality, approvedValidationTesting, approvedImplementationControl) {
    const audit = createAuditTrail();
    const stages = {};
    const result = await runFinalSummaryStage(query, approvedImpactAssessment, approvedRiskCriticality, approvedValidationTesting, approvedImplementationControl);
    const gate = evaluateGate("final_summary", result.parsed, result.error);
    stages.finalSummary = { ...result, gate };
    audit.record({ ...gate });
    if (!gate.passed) {
        return finalize("halted_for_human_review", "final_summary", stages, audit.all());
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