import type { GateResult, PipelineResult } from "../types/pipeline";

/**
 * Realistic sample data for previewing the Change Control workflow pages
 * (Change Impact Assessment + Risk & Criticality Evaluation) without a
 * live backend. Wire this into a "Load Sample Data" button on the guard
 * fallback of either page — for local UI preview / demo purposes only.
 */
function passingGate(): GateResult {
  return {
    stage: "classification",
    passed: true,
    reasons: [],
    routedTo: null,
  };
}

export function buildSampleChangeControlResult(): PipelineResult {
  return {
    status: "halted_for_human_review",
    haltedAt: "classification",
    query:
      "Upgrading the HVAC control software on Building A's cleanroom system to v4.2 to support new humidity setpoints.",
    auditTrail: [],
    stages: {
      classification: {
        rawText: "",
        error: null,
        gate: passingGate(),
        parsed: {
          classification: "Change Control",
          rationale: [
            "The request describes a planned, intentional modification to a validated system rather than an unplanned deviation from procedure.",
            "There is no quality event, excursion, or non-conformance being reported — this is a proactive change.",
          ],
          confidence_score: 92,
        },
      },
      changeImpactAssessment: {
        rawText: "",
        error: null,
        gate: passingGate(),
        parsed: {
          impacted_systems: [
            "Building A Cleanroom HVAC Control System",
            "Environmental Monitoring System (EMS) integration",
            "Batch record humidity logging process",
          ],
          gxp_classification: {
            value: "Direct Impact",
            rationale:
              "The HVAC control software directly manages environmental parameters that are part of the validated cleanroom qualification.",
          },
          data_validation_impact: {
            validated_state_affected: true,
            rationale:
              "Updating the setpoint logic requires re-verification of the validated state before the change can be released to production.",
          },
          downstream_dependencies: [
            "EMS alarm thresholds (interface)",
            "Batch record environmental data report",
            "Building Management System (BMS) integration",
          ],
          risk_scoring: {
            level: "Moderate",
            rationale:
              "Directly affects a GxP-classified, validated environmental control system; change is scoped to software configuration only, using a vendor-supplied update with a documented change history and no open defects affecting cleanroom operation.",
          },
          confidence_score: 85,
        },
      },
      riskCriticality: {
        rawText: "",
        error: null,
        gate: passingGate(),
        parsed: {
          patient_safety_product_quality_impact: {
            level: "Moderate",
            rationale:
              "Incorrect humidity control could affect product stability for humidity-sensitive materials stored or processed in Building A, but the change does not alter product contact surfaces or formulation.",
          },
          regulatory_impact: {
            level: "Low",
            filings_or_submissions_affected: [],
            rationale:
              "No regulatory filings reference specific HVAC software versions; this is considered a facility/utility change under the site's existing validation master plan.",
          },
          data_integrity_risk: {
            level: "Moderate",
            rationale:
              "Environmental monitoring data logging format is unchanged, but historical trend continuity should be verified after cutover to confirm no gaps in the audit trail.",
          },
          operational_disruption_risk: {
            level: "High",
            rationale:
              "The update requires a planned HVAC system restart, which will halt cleanroom operations in Building A for an estimated 4-hour maintenance window.",
          },
          risk_ranking_justification:
            "Overall risk is ranked Moderate. While operational disruption is High due to required downtime, patient safety, data integrity, and regulatory exposure are all Low-to-Moderate given the change is scoped to configuration only and does not affect product contact or formulation. The primary mitigation is scheduling the change during planned downtime and completing environmental re-qualification before resuming production.",
          confidence_score: 85,
        },
      },
    },
  };
}