import { useCallback, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { generateValidationTesting } from "../../services/changeControl/validationTestingApi";
import {
  aiField,
  markModified,
  type RiskCriticalityProvenance,
} from "../../types/dataProvenance";
import type {
  RiskLevel,
  RiskCriticalityParsed,
  ValidationTestingApiResponse,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { nestedToFlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import { flatToNestedValidationTesting } from "../../utils/changeControlAdapters";
import { useOverrideDialogState } from "../shared/useOverRideDialogState";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

// Field labels — mirrors CHANGE_IMPACT_FIELD_LABELS convention in mockImpactAssessment.ts
export const RISK_FIELD_LABELS = {
  patient_safety_product_quality_impact:
    "Patient Safety / Product Quality Impact",
  regulatory_impact: "Regulatory Impact",
  data_integrity_risk: "Data Integrity Risk",
  operational_disruption_risk: "Operational Disruption Risk",
} as const;

// ---------------------------------------------------------------------------
// Form reducer: the 14 editable risk-evaluation fields, previously 14
// separate useState calls. Grouping them here means every related pair
// (e.g. "level changed" + "changed-without-rationale flag") always updates
// together in one dispatch, instead of two setter calls that could drift
// out of sync.
// ---------------------------------------------------------------------------
interface RiskFormState {
  psLevel: RiskLevel;
  psRationale: string;
  regLevel: RiskLevel;
  regFilings: string[];
  regRationale: string;
  diLevel: RiskLevel;
  diRationale: string;
  odLevel: RiskLevel;
  odRationale: string;
  rankingJustification: string;
  psChangedWithoutRationale: boolean;
  regChangedWithoutRationale: boolean;
  diChangedWithoutRationale: boolean;
  odChangedWithoutRationale: boolean;
}

type RiskFormAction =
  | { type: "HYDRATE"; parsed: RiskCriticalityParsed }
  | { type: "SET_PS_LEVEL"; value: RiskLevel; original: RiskLevel }
  | { type: "SET_PS_RATIONALE"; value: string; original: string }
  | { type: "SET_REG_LEVEL"; value: RiskLevel; original: RiskLevel }
  | { type: "SET_REG_FILINGS"; value: string[] }
  | { type: "SET_REG_RATIONALE"; value: string; original: string }
  | { type: "SET_DI_LEVEL"; value: RiskLevel; original: RiskLevel }
  | { type: "SET_DI_RATIONALE"; value: string; original: string }
  | { type: "SET_OD_LEVEL"; value: RiskLevel; original: RiskLevel }
  | { type: "SET_OD_RATIONALE"; value: string; original: string }
  | { type: "SET_RANKING_JUSTIFICATION"; value: string };

const initialRiskFormState: RiskFormState = {
  psLevel: "Low",
  psRationale: "",
  regLevel: "Low",
  regFilings: [],
  regRationale: "",
  diLevel: "Low",
  diRationale: "",
  odLevel: "Low",
  odRationale: "",
  rankingJustification: "",
  psChangedWithoutRationale: false,
  regChangedWithoutRationale: false,
  diChangedWithoutRationale: false,
  odChangedWithoutRationale: false,
};

function hydrateFromParsed(parsed: RiskCriticalityParsed): RiskFormState {
  return {
    psLevel: parsed.patient_safety_product_quality_impact.level,
    psRationale: parsed.patient_safety_product_quality_impact.rationale,
    regLevel: parsed.regulatory_impact.level,
    regFilings: parsed.regulatory_impact.filings_or_submissions_affected,
    regRationale: parsed.regulatory_impact.rationale,
    diLevel: parsed.data_integrity_risk.level,
    diRationale: parsed.data_integrity_risk.rationale,
    odLevel: parsed.operational_disruption_risk.level,
    odRationale: parsed.operational_disruption_risk.rationale,
    rankingJustification: parsed.risk_ranking_justification,
    psChangedWithoutRationale: false,
    regChangedWithoutRationale: false,
    diChangedWithoutRationale: false,
    odChangedWithoutRationale: false,
  };
}

function riskFormReducer(
  state: RiskFormState,
  action: RiskFormAction,
): RiskFormState {
  switch (action.type) {
    case "HYDRATE":
      return hydrateFromParsed(action.parsed);
    case "SET_PS_LEVEL":
      return {
        ...state,
        psLevel: action.value,
        psChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_PS_RATIONALE":
      return {
        ...state,
        psRationale: action.value,
        psChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.psChangedWithoutRationale,
      };
    case "SET_REG_LEVEL":
      return {
        ...state,
        regLevel: action.value,
        regChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_REG_FILINGS":
      return { ...state, regFilings: action.value };
    case "SET_REG_RATIONALE":
      return {
        ...state,
        regRationale: action.value,
        regChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.regChangedWithoutRationale,
      };
    case "SET_DI_LEVEL":
      return {
        ...state,
        diLevel: action.value,
        diChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_DI_RATIONALE":
      return {
        ...state,
        diRationale: action.value,
        diChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.diChangedWithoutRationale,
      };
    case "SET_OD_LEVEL":
      return {
        ...state,
        odLevel: action.value,
        odChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_OD_RATIONALE":
      return {
        ...state,
        odRationale: action.value,
        odChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.odChangedWithoutRationale,
      };
    case "SET_RANKING_JUSTIFICATION":
      return { ...state, rankingJustification: action.value };
    default:
      return state;
  }
}

export function useRiskCriticality() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;

  const [form, dispatchForm] = useReducer(
    riskFormReducer,
    initialRiskFormState,
  );
  const override = useOverrideDialogState();
  const llmFailure = useLlmFailureRecovery();

  // Re-hydrate local editable state whenever a *new* risk evaluation lands
  // in the store. A plain useState initializer only runs on first mount —
  // if this page is already mounted (e.g. showing the "no data" fallback
  // below) when the API response arrives, that initializer is missed and
  // the form would stay blank forever without this effect.
  useEffect(() => {
    if (!riskParsed) return;
    dispatchForm({ type: "HYDRATE", parsed: riskParsed });
    override.resetOnHydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskParsed]);

  // Field update helpers — wrapped in useCallback so their reference stays
  // stable across renders. Without this, React.memo on the card components
  // below would be pointless: a new function prop every render still
  // forces the child to re-render regardless of memo.
  const updatePsLevel = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_PS_LEVEL",
        value: value as RiskLevel,
        original: riskParsed.patient_safety_product_quality_impact.level,
      });
    },
    [riskParsed],
  );
  const updatePsRationale = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_PS_RATIONALE",
        value,
        original: riskParsed.patient_safety_product_quality_impact.rationale,
      });
    },
    [riskParsed],
  );

  const updateRegLevel = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_REG_LEVEL",
        value: value as RiskLevel,
        original: riskParsed.regulatory_impact.level,
      });
    },
    [riskParsed],
  );
  const updateRegRationale = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_REG_RATIONALE",
        value,
        original: riskParsed.regulatory_impact.rationale,
      });
    },
    [riskParsed],
  );
  const setRegFilings = useCallback(
    (value: string[]) => dispatchForm({ type: "SET_REG_FILINGS", value }),
    [],
  );

  const updateDiLevel = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_DI_LEVEL",
        value: value as RiskLevel,
        original: riskParsed.data_integrity_risk.level,
      });
    },
    [riskParsed],
  );
  const updateDiRationale = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_DI_RATIONALE",
        value,
        original: riskParsed.data_integrity_risk.rationale,
      });
    },
    [riskParsed],
  );

  const updateOdLevel = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_OD_LEVEL",
        value: value as RiskLevel,
        original: riskParsed.operational_disruption_risk.level,
      });
    },
    [riskParsed],
  );
  const updateOdRationale = useCallback(
    (value: string) => {
      if (!riskParsed) return;
      dispatchForm({
        type: "SET_OD_RATIONALE",
        value,
        original: riskParsed.operational_disruption_risk.rationale,
      });
    },
    [riskParsed],
  );

  const setRankingJustification = useCallback(
    (value: string) =>
      dispatchForm({ type: "SET_RANKING_JUSTIFICATION", value }),
    [],
  );

  // Approved risk criticality — already 1:1 with backend's RiskCriticalitySchema
  // (unlike Stage 1, no flat/nested adapter is needed for this stage).
  const buildApprovedRiskCriticality = (): RiskCriticalityParsed | null =>
    riskParsed
      ? {
          ...riskParsed,
          patient_safety_product_quality_impact: {
            level: form.psLevel,
            rationale: form.psRationale,
          },
          regulatory_impact: {
            level: form.regLevel,
            filings_or_submissions_affected: form.regFilings,
            rationale: form.regRationale,
          },
          data_integrity_risk: {
            level: form.diLevel,
            rationale: form.diRationale,
          },
          operational_disruption_risk: {
            level: form.odLevel,
            rationale: form.odRationale,
          },
          risk_ranking_justification: form.rankingJustification,
        }
      : null;

  const buildRiskProvenance = (
    confirmed: boolean,
  ): RiskCriticalityProvenance | null => {
    if (!riskParsed) return null;
    const original = riskParsed;

    const psLevelField =
      confirmed &&
      form.psLevel !== original.patient_safety_product_quality_impact.level
        ? markModified(
            aiField(original.patient_safety_product_quality_impact.level),
            form.psLevel,
          )
        : aiField(original.patient_safety_product_quality_impact.level);
    const psRationaleField =
      confirmed &&
      form.psRationale !==
        original.patient_safety_product_quality_impact.rationale
        ? markModified(
            aiField(original.patient_safety_product_quality_impact.rationale),
            form.psRationale,
          )
        : aiField(original.patient_safety_product_quality_impact.rationale);

    const regLevelField =
      confirmed && form.regLevel !== original.regulatory_impact.level
        ? markModified(aiField(original.regulatory_impact.level), form.regLevel)
        : aiField(original.regulatory_impact.level);
    const regFilingsField =
      confirmed &&
      JSON.stringify(form.regFilings) !==
        JSON.stringify(
          original.regulatory_impact.filings_or_submissions_affected,
        )
        ? markModified(
            aiField(original.regulatory_impact.filings_or_submissions_affected),
            form.regFilings,
          )
        : aiField(original.regulatory_impact.filings_or_submissions_affected);
    const regRationaleField =
      confirmed && form.regRationale !== original.regulatory_impact.rationale
        ? markModified(
            aiField(original.regulatory_impact.rationale),
            form.regRationale,
          )
        : aiField(original.regulatory_impact.rationale);

    const diLevelField =
      confirmed && form.diLevel !== original.data_integrity_risk.level
        ? markModified(
            aiField(original.data_integrity_risk.level),
            form.diLevel,
          )
        : aiField(original.data_integrity_risk.level);
    const diRationaleField =
      confirmed && form.diRationale !== original.data_integrity_risk.rationale
        ? markModified(
            aiField(original.data_integrity_risk.rationale),
            form.diRationale,
          )
        : aiField(original.data_integrity_risk.rationale);

    const odLevelField =
      confirmed && form.odLevel !== original.operational_disruption_risk.level
        ? markModified(
            aiField(original.operational_disruption_risk.level),
            form.odLevel,
          )
        : aiField(original.operational_disruption_risk.level);
    const odRationaleField =
      confirmed &&
      form.odRationale !== original.operational_disruption_risk.rationale
        ? markModified(
            aiField(original.operational_disruption_risk.rationale),
            form.odRationale,
          )
        : aiField(original.operational_disruption_risk.rationale);

    const rankingField =
      confirmed &&
      form.rankingJustification !== original.risk_ranking_justification
        ? markModified(
            aiField(original.risk_ranking_justification),
            form.rankingJustification,
          )
        : aiField(original.risk_ranking_justification);

    return {
      patient_safety_product_quality_impact: {
        level: psLevelField,
        rationale: psRationaleField,
      },
      regulatory_impact: {
        level: regLevelField,
        filings_or_submissions_affected: regFilingsField,
        rationale: regRationaleField,
      },
      data_integrity_risk: { level: diLevelField, rationale: diRationaleField },
      operational_disruption_risk: {
        level: odLevelField,
        rationale: odRationaleField,
      },
      risk_ranking_justification: rankingField,
      confidence_score: original.confidence_score,
    };
  };

  const navigateToValidationTesting = (
    validationTestingStage: ValidationTestingApiResponse["stages"]["validationTesting"],
    riskProvenance: RiskCriticalityProvenance,
    approvedRiskCriticality: RiskCriticalityParsed,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        riskCriticality: {
          ...result!.stages.riskCriticality!,
          parsed: approvedRiskCriticality,
        },
        validationTesting: validationTestingStage,
      },
      provenance: {
        ...result!.provenance,
        riskCriticality: riskProvenance,
      },
    });
    navigate("/change-control/validation-testing");
  };

  const submitRiskCriticality = async (
    riskProvenance: RiskCriticalityProvenance,
  ) => {
    if (!impactParsed) return;
    override.submitStart();
    const approvedRiskCriticality = buildApprovedRiskCriticality()!;
    const flatChangeImpactAssessment =
      nestedToFlatChangeImpactAssessment(impactParsed);
    try {
      // The backend returns validationTesting.parsed in its flat LLM-schema
      // shape — convert to the nested shape the UI expects before it ever
      // touches the store/page.
      const rawValidationResult = await generateValidationTesting(
        result!.query,
        flatChangeImpactAssessment,
        approvedRiskCriticality,
      );
      const rawStage = rawValidationResult?.stages?.validationTesting;
      const validationTestingStage: ValidationTestingApiResponse["stages"]["validationTesting"] =
        rawStage
          ? {
              ...rawStage,
              parsed: rawStage.parsed
                ? flatToNestedValidationTesting(rawStage.parsed)
                : null,
            }
          : undefined;
      override.submitSuccess();
      navigateToValidationTesting(
        validationTestingStage,
        riskProvenance,
        approvedRiskCriticality,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the risk & criticality evaluation. Please try again.";
      override.submitFailure(message);
      // `result` predates this Accept — patch in the just-approved risk
      // criticality so Resume doesn't lose the approval just made.
      const patchedResult = result
        ? {
            ...result,
            stages: {
              ...result.stages,
              riskCriticality: {
                ...result.stages.riskCriticality!,
                parsed: approvedRiskCriticality,
              },
            },
            provenance: {
              ...result.provenance,
              riskCriticality: riskProvenance,
            },
          }
        : null;
      llmFailure.openLlmFailureDialog({
        entityType: "Change Control",
        pipelineStage: "validation_testing",
        queryText: result!.query,
        errorMessage: message,
        pipelineContext: patchedResult,
      });
    }
  };

  const handleAccept = () => {
    const riskProvenance = buildRiskProvenance(override.overrideConfirmed);
    if (!riskProvenance) return;
    const existingValidationTesting = result!.stages?.validationTesting;
    if (!override.overrideConfirmed && existingValidationTesting?.parsed) {
      navigateToValidationTesting(
        existingValidationTesting,
        riskProvenance,
        buildApprovedRiskCriticality()!,
      );
      return;
    }
    void submitRiskCriticality(riskProvenance);
  };

  const handleOverrideClick = () => override.setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsRationale: string[] = [];
    if (form.psChangedWithoutRationale)
      needsRationale.push(
        RISK_FIELD_LABELS.patient_safety_product_quality_impact,
      );
    if (form.regChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.regulatory_impact);
    if (form.diChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.data_integrity_risk);
    if (form.odChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.operational_disruption_risk);

    if (needsRationale.length > 0) {
      override.setWarningFields(needsRationale);
      override.setShowRationaleWarning(true);
      return;
    }
    override.setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!riskParsed) return;
    override.setIsOverrideEditing(false);
    dispatchForm({ type: "HYDRATE", parsed: riskParsed });
  };

  const handleOverrideConfirm = () => {
    if (!override.overrideJustification.trim()) return;
    override.confirmOverride();
  };

  const handleReject = () => {
    if (override.rejectJustification.trim()) {
      override.setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  const confidenceScore = riskParsed?.confidence_score ?? 0;

  const isPsModified =
    !!riskParsed &&
    override.overrideConfirmed &&
    (form.psLevel !== riskParsed.patient_safety_product_quality_impact.level ||
      form.psRationale !==
        riskParsed.patient_safety_product_quality_impact.rationale);
  const isRegModified =
    !!riskParsed &&
    override.overrideConfirmed &&
    (form.regLevel !== riskParsed.regulatory_impact.level ||
      form.regRationale !== riskParsed.regulatory_impact.rationale ||
      JSON.stringify(form.regFilings) !==
        JSON.stringify(
          riskParsed.regulatory_impact.filings_or_submissions_affected,
        ));
  const isDiModified =
    !!riskParsed &&
    override.overrideConfirmed &&
    (form.diLevel !== riskParsed.data_integrity_risk.level ||
      form.diRationale !== riskParsed.data_integrity_risk.rationale);
  const isOdModified =
    !!riskParsed &&
    override.overrideConfirmed &&
    (form.odLevel !== riskParsed.operational_disruption_risk.level ||
      form.odRationale !== riskParsed.operational_disruption_risk.rationale);
  const isRankingModified =
    !!riskParsed &&
    override.overrideConfirmed &&
    form.rankingJustification !== riskParsed.risk_ranking_justification;

  return {
    navigate,
    chatOpen,
    setChatOpen,

    result,
    classificationParsed,
    impactParsed,
    riskParsed,

    psLevel: form.psLevel,
    psRationale: form.psRationale,
    regLevel: form.regLevel,
    regFilings: form.regFilings,
    setRegFilings,
    regRationale: form.regRationale,
    diLevel: form.diLevel,
    diRationale: form.diRationale,
    odLevel: form.odLevel,
    odRationale: form.odRationale,
    rankingJustification: form.rankingJustification,
    setRankingJustification,

    updatePsLevel,
    updatePsRationale,
    updateRegLevel,
    updateRegRationale,
    updateDiLevel,
    updateDiRationale,
    updateOdLevel,
    updateOdRationale,

    psChangedWithoutRationale: form.psChangedWithoutRationale,
    regChangedWithoutRationale: form.regChangedWithoutRationale,
    diChangedWithoutRationale: form.diChangedWithoutRationale,
    odChangedWithoutRationale: form.odChangedWithoutRationale,

    isPsModified,
    isRegModified,
    isDiModified,
    isOdModified,
    isRankingModified,

    isOverrideEditing: override.isOverrideEditing,
    overrideConfirmed: override.overrideConfirmed,

    showOverrideDialog: override.showOverrideDialog,
    setShowOverrideDialog: override.setShowOverrideDialog,
    overrideJustification: override.overrideJustification,
    setOverrideJustification: override.setOverrideJustification,
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,
    showRationaleWarning: override.showRationaleWarning,
    setShowRationaleWarning: override.setShowRationaleWarning,
    warningFields: override.warningFields,

    isSubmitting: override.isSubmitting,
    submitError: override.submitError,
    confidenceScore,
    llmFailure,

    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}
