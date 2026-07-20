import type {
  ChangeImpactAssessmentParsed,
  GxpClassification,
  RiskLevel,
} from "../types/pipeline";

export interface FlatChangeImpactAssessment {
  impacted_systems_processes_studies: string[];
  gxp_classification: "Direct" | "Indirect";
  validated_state_affected: boolean;
  data_validation_impact_rationale: string;
  downstream_dependencies: string[];
  risk_scoring: RiskLevel;
  rationale: string[];
  confidence_score: number;
}

const GXP_FLAT_TO_NESTED: Record<
  FlatChangeImpactAssessment["gxp_classification"],
  GxpClassification
> = {
  Direct: "Direct Impact",
  Indirect: "Indirect Impact",
};

const GXP_NESTED_TO_FLAT: Record<
  GxpClassification,
  FlatChangeImpactAssessment["gxp_classification"]
> = {
  "Direct Impact": "Direct",
  "Indirect Impact": "Indirect",
};

/**
 * Backend response (flat) -> frontend UI state (nested).
 *
 * The backend only has ONE shared `rationale: string[]` for the whole
 * assessment — it does not track separate rationale for GxP classification
 * vs. risk scoring. Both of those UI cards are seeded from that same shared
 * rationale text as a result. Data & Validation Impact is the one field the
 * backend *does* track separately (`data_validation_impact_rationale`), so
 * that one maps 1:1.
 */
export function flatToNestedChangeImpactAssessment(
  flat: FlatChangeImpactAssessment,
): ChangeImpactAssessmentParsed {
  const sharedRationale = flat.rationale.join(" ");

  return {
    impacted_systems: flat.impacted_systems_processes_studies,
    gxp_classification: {
      value: GXP_FLAT_TO_NESTED[flat.gxp_classification],
      rationale: sharedRationale,
    },
    data_validation_impact: {
      validated_state_affected: flat.validated_state_affected,
      rationale: flat.data_validation_impact_rationale,
    },
    downstream_dependencies: flat.downstream_dependencies,
    risk_scoring: {
      level: flat.risk_scoring,
      rationale: sharedRationale,
    },
    confidence_score: flat.confidence_score,
  };
}

/**
 * Frontend UI state (nested, post-edit/override) -> backend wire shape
 * (flat), for submitting the approved Stage 1 result to
 * /api/change-control/risk-criticality.
 *
 * Because the backend has no separate rationale slots for GxP classification
 * or risk scoring, any edits a user makes to those two rationale fields are
 * folded back into the single shared `rationale` array (deduped) so the
 * information isn't silently dropped, even though the backend won't be able
 * to tell which card it came from.
 */
export function nestedToFlatChangeImpactAssessment(
  nested: ChangeImpactAssessmentParsed,
): FlatChangeImpactAssessment {
  const sharedRationale = Array.from(
    new Set(
      [nested.gxp_classification.rationale, nested.risk_scoring.rationale]
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  return {
    impacted_systems_processes_studies: nested.impacted_systems,
    gxp_classification: GXP_NESTED_TO_FLAT[nested.gxp_classification.value],
    validated_state_affected:
      nested.data_validation_impact.validated_state_affected,
    data_validation_impact_rationale: nested.data_validation_impact.rationale,
    downstream_dependencies: nested.downstream_dependencies,
    risk_scoring: nested.risk_scoring.level,
    rationale:
      sharedRationale.length > 0 ? sharedRationale : ["No rationale provided."],
    confidence_score: nested.confidence_score,
  };
}
