import { useCallback, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { generateRiskCriticality } from "../../services/changeControl/riskCriticalityApi";
import {
  autoField,
  type ChangeImpactAssessmentProvenance,
} from "../../types/dataProvenance";
import type {
  ChangeImpactAssessmentParsed,
  GxpClassification,
  RiskLevel,
  RiskCriticalityApiResponse,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";
import { nestedToFlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import { useOverrideDialogState } from "../shared/useOverRideDialogState";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

// ---------------------------------------------------------------------------
// Form reducer: the editable change-impact fields, previously 13 separate
// useState calls. See useRiskCriticality.ts for the same pattern applied
// to its sibling page. Every field here is directly editable at all times —
// seeded from the AI output but freely changeable without first entering
// any separate "override" mode.
// ---------------------------------------------------------------------------
interface ImpactFormState {
  impactedSystems: string[];
  downstreamDependencies: string[];
  gxpValue: GxpClassification;
  gxpRationale: string;
  validatedStateAffected: boolean;
  dataValidationRationale: string;
  riskLevel: RiskLevel;
  riskRationale: string;
  gxpChangedWithoutRationale: boolean;
  validationChangedWithoutRationale: boolean;
  riskChangedWithoutRationale: boolean;
}

type ImpactFormAction =
  | { type: "HYDRATE"; parsed: ChangeImpactAssessmentParsed }
  | { type: "SET_IMPACTED_SYSTEMS"; value: string[] }
  | { type: "SET_DOWNSTREAM_DEPENDENCIES"; value: string[] }
  | {
      type: "SET_GXP_VALUE";
      value: GxpClassification;
      original: GxpClassification;
    }
  | { type: "SET_GXP_RATIONALE"; value: string; original: string }
  | { type: "SET_VALIDATED_STATE_AFFECTED"; value: boolean; original: boolean }
  | { type: "SET_DATA_VALIDATION_RATIONALE"; value: string; original: string }
  | { type: "SET_RISK_LEVEL"; value: RiskLevel; original: RiskLevel }
  | { type: "SET_RISK_RATIONALE"; value: string; original: string }
  | { type: "CLEAR" };

const initialImpactFormState: ImpactFormState = {
  impactedSystems: [],
  downstreamDependencies: [],
  gxpValue: "Indirect Impact",
  gxpRationale: "",
  validatedStateAffected: false,
  dataValidationRationale: "",
  riskLevel: "Low",
  riskRationale: "",
  gxpChangedWithoutRationale: false,
  validationChangedWithoutRationale: false,
  riskChangedWithoutRationale: false,
};

function hydrateImpactForm(
  parsed: ChangeImpactAssessmentParsed,
): ImpactFormState {
  return {
    impactedSystems: parsed.impacted_systems,
    downstreamDependencies: parsed.downstream_dependencies,
    gxpValue: parsed.gxp_classification.value,
    gxpRationale: parsed.gxp_classification.rationale,
    validatedStateAffected:
      parsed.data_validation_impact.validated_state_affected,
    dataValidationRationale: parsed.data_validation_impact.rationale,
    riskLevel: parsed.risk_scoring.level,
    riskRationale: parsed.risk_scoring.rationale,
    gxpChangedWithoutRationale: false,
    validationChangedWithoutRationale: false,
    riskChangedWithoutRationale: false,
  };
}

function impactFormReducer(
  state: ImpactFormState,
  action: ImpactFormAction,
): ImpactFormState {
  switch (action.type) {
    case "HYDRATE":
      return hydrateImpactForm(action.parsed);
    case "SET_IMPACTED_SYSTEMS":
      return { ...state, impactedSystems: action.value };
    case "SET_DOWNSTREAM_DEPENDENCIES":
      return { ...state, downstreamDependencies: action.value };
    case "SET_GXP_VALUE":
      return {
        ...state,
        gxpValue: action.value,
        gxpChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_GXP_RATIONALE":
      return {
        ...state,
        gxpRationale: action.value,
        gxpChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.gxpChangedWithoutRationale,
      };
    case "SET_VALIDATED_STATE_AFFECTED":
      return {
        ...state,
        validatedStateAffected: action.value,
        validationChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_DATA_VALIDATION_RATIONALE":
      return {
        ...state,
        dataValidationRationale: action.value,
        validationChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.validationChangedWithoutRationale,
      };
    case "SET_RISK_LEVEL":
      return {
        ...state,
        riskLevel: action.value,
        riskChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_RISK_RATIONALE":
      return {
        ...state,
        riskRationale: action.value,
        riskChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.riskChangedWithoutRationale,
      };
    case "CLEAR":
      return initialImpactFormState;
    default:
      return state;
  }
}

export function useChangeImpactAssessmentReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const changeImpactParsed =
    result?.stages?.changeImpactAssessment?.parsed ?? null;

  const [form, dispatchForm] = useReducer(
    impactFormReducer,
    changeImpactParsed
      ? hydrateImpactForm(changeImpactParsed)
      : initialImpactFormState,
  );
  const override = useOverrideDialogState();
  const llmFailure = useLlmFailureRecovery();
  // Only surfaced after the user rejects the assessment (and the fields get
  // cleared) — hidden otherwise.
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  // Client-side check so an accidental Accept right after Reject clears the
  // fields doesn't silently save empty data to the audit trail.
  const [emptyFieldsWarning, setEmptyFieldsWarning] = useState<string | null>(
    null,
  );

  const setImpactedSystems = useCallback(
    (value: string[]) => dispatchForm({ type: "SET_IMPACTED_SYSTEMS", value }),
    [],
  );
  const setDownstreamDependencies = useCallback(
    (value: string[]) =>
      dispatchForm({ type: "SET_DOWNSTREAM_DEPENDENCIES", value }),
    [],
  );

  const updateGxpValue = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_GXP_VALUE",
        value: value as GxpClassification,
        original: changeImpactParsed.gxp_classification.value,
      });
    },
    [changeImpactParsed],
  );

  const updateGxpRationale = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_GXP_RATIONALE",
        value,
        original: changeImpactParsed.gxp_classification.rationale,
      });
    },
    [changeImpactParsed],
  );

  const updateValidatedStateAffected = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_VALIDATED_STATE_AFFECTED",
        value: value === "true",
        original:
          changeImpactParsed.data_validation_impact.validated_state_affected,
      });
    },
    [changeImpactParsed],
  );

  const updateDataValidationRationale = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_DATA_VALIDATION_RATIONALE",
        value,
        original: changeImpactParsed.data_validation_impact.rationale,
      });
    },
    [changeImpactParsed],
  );

  const updateRiskLevel = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_RISK_LEVEL",
        value: value as RiskLevel,
        original: changeImpactParsed.risk_scoring.level,
      });
    },
    [changeImpactParsed],
  );

  const updateRiskRationale = useCallback(
    (value: string) => {
      if (!changeImpactParsed) return;
      dispatchForm({
        type: "SET_RISK_RATIONALE",
        value,
        original: changeImpactParsed.risk_scoring.rationale,
      });
    },
    [changeImpactParsed],
  );

  const buildApprovedChangeImpactAssessment =
    (): ChangeImpactAssessmentParsed => ({
      ...changeImpactParsed!,
      impacted_systems: form.impactedSystems,
      gxp_classification: {
        value: form.gxpValue,
        rationale: form.gxpRationale,
      },
      data_validation_impact: {
        validated_state_affected: form.validatedStateAffected,
        rationale: form.dataValidationRationale,
      },
      downstream_dependencies: form.downstreamDependencies,
      risk_scoring: { level: form.riskLevel, rationale: form.riskRationale },
    });

  const buildChangeImpactProvenance = (): ChangeImpactAssessmentProvenance => {
    const original = changeImpactParsed!;

    return {
      impacted_systems: autoField(
        original.impacted_systems,
        form.impactedSystems,
      ),
      downstream_dependencies: autoField(
        original.downstream_dependencies,
        form.downstreamDependencies,
      ),
      gxp_classification: {
        value: autoField(original.gxp_classification.value, form.gxpValue),
        rationale: autoField(
          original.gxp_classification.rationale,
          form.gxpRationale,
        ),
      },
      data_validation_impact: {
        validated_state_affected: autoField(
          original.data_validation_impact.validated_state_affected,
          form.validatedStateAffected,
        ),
        rationale: autoField(
          original.data_validation_impact.rationale,
          form.dataValidationRationale,
        ),
      },
      risk_scoring: {
        level: autoField(original.risk_scoring.level, form.riskLevel),
        rationale: autoField(
          original.risk_scoring.rationale,
          form.riskRationale,
        ),
      },
      confidence_score: original.confidence_score,
    };
  };

  const navigateToRiskCriticality = (
    riskCriticalityStage: RiskCriticalityApiResponse["stages"]["riskCriticality"],
    changeImpactProvenance: ChangeImpactAssessmentProvenance,
    approvedChangeImpactAssessment: ChangeImpactAssessmentParsed,
  ) => {
    mergePipelineResult({
      stages: {
        ...(result!.stages as any),
        changeImpactAssessment: {
          ...result!.stages.changeImpactAssessment!,
          parsed: approvedChangeImpactAssessment,
        },
        riskCriticality: riskCriticalityStage,
      } as any,
      provenance: {
        ...result!.provenance,
        changeImpactAssessment: changeImpactProvenance,
      },
    });
    navigate("/change-control/risk-criticality");
  };

  const submitChangeImpactAssessment = async (
    changeImpactProvenance: ChangeImpactAssessmentProvenance,
  ) => {
    override.submitStart();
    const approvedChangeImpactAssessment =
      buildApprovedChangeImpactAssessment();
    const flatChangeImpactAssessment = nestedToFlatChangeImpactAssessment(
      approvedChangeImpactAssessment,
    );
    try {
      const riskResult: RiskCriticalityApiResponse =
        await generateRiskCriticality(
          result!.query,
          classificationParsed,
          flatChangeImpactAssessment,
        );
      override.submitSuccess();
      navigateToRiskCriticality(
        riskResult.stages.riskCriticality,
        changeImpactProvenance,
        approvedChangeImpactAssessment,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the change impact assessment. Please try again.";
      override.submitFailure(message);
      // `result` predates this Accept — patch in the just-approved change
      // impact assessment so Resume doesn't lose the approval just made.
      const patchedResult = result
        ? {
            ...result,
            stages: {
              ...result.stages,
              changeImpactAssessment: {
                ...result.stages.changeImpactAssessment!,
                parsed: approvedChangeImpactAssessment,
              },
            },
            provenance: {
              ...result.provenance,
              changeImpactAssessment: changeImpactProvenance,
            },
          }
        : null;
      llmFailure.openLlmFailureDialog({
        entityType: "Change Control",
        pipelineStage: "risk_criticality",
        queryText: result!.query,
        errorMessage: message,
        pipelineContext: patchedResult,
      });
    }
  };

  // Accept stays disabled until every field is filled in — most notably
  // right after a Reject clears them.
  const canAccept =
    form.gxpRationale.trim() !== "" &&
    form.dataValidationRationale.trim() !== "" &&
    form.riskRationale.trim() !== "" &&
    form.impactedSystems.length > 0 &&
    form.downstreamDependencies.length > 0;

  const handleAccept = () => {
    // If a value was changed but its rationale wasn't updated to explain
    // why, block Accept and ask for that first — same guardrail that used
    // to live in the old "Save Changes" step, just triggered by Accept
    // directly now that there's no separate override mode.
    const needsRationale: string[] = [];
    if (form.gxpChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.gxp_classification);
    if (form.validationChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.data_validation_impact);
    if (form.riskChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.risk_scoring);

    if (needsRationale.length > 0) {
      override.setWarningFields(needsRationale);
      override.setShowRationaleWarning(true);
      return;
    }

    // Guard against accepting right after a Reject cleared the fields —
    // don't silently save empty data to the audit trail.
    if (
      form.gxpRationale.trim() === "" ||
      form.dataValidationRationale.trim() === "" ||
      form.riskRationale.trim() === "" ||
      form.impactedSystems.length === 0 ||
      form.downstreamDependencies.length === 0
    ) {
      setEmptyFieldsWarning(
        "One or more change impact fields are empty. Please fill them in before accepting.",
      );
      return;
    }
    setEmptyFieldsWarning(null);

    const changeImpactProvenance = buildChangeImpactProvenance();
    const isEdited = [
      changeImpactProvenance.impacted_systems,
      changeImpactProvenance.downstream_dependencies,
      changeImpactProvenance.gxp_classification.value,
      changeImpactProvenance.gxp_classification.rationale,
      changeImpactProvenance.data_validation_impact.validated_state_affected,
      changeImpactProvenance.data_validation_impact.rationale,
      changeImpactProvenance.risk_scoring.level,
      changeImpactProvenance.risk_scoring.rationale,
    ].some((field) => field.source === "modified");

    const existingRiskCriticality = result!.stages?.riskCriticality;
    if (!isEdited && existingRiskCriticality?.parsed) {
      navigateToRiskCriticality(
        existingRiskCriticality,
        changeImpactProvenance,
        buildApprovedChangeImpactAssessment(),
      );
      return;
    }
    void submitChangeImpactAssessment(changeImpactProvenance);
  };

  const handleReject = () => {
    override.setShowRejectDialog(false);
    // Clear the AI-generated fields — the user rejected the AI's
    // suggestion, so we don't leave it sitting in the form. They can
    // either fill this in manually or pull the AI suggestion back in
    // with the button above.
    dispatchForm({ type: "CLEAR" });
    setShowAiSuggestion(true);
  };

  // Restores the original AI-generated assessment into the form — used by
  // the "AI Suggestion" button so a rejected/cleared field can be brought
  // back.
  const handleGetAiSuggestion = () => {
    if (!changeImpactParsed) return;
    dispatchForm({ type: "HYDRATE", parsed: changeImpactParsed });
  };

  const isGxpModified =
    !!changeImpactParsed &&
    (form.gxpValue !== changeImpactParsed.gxp_classification.value ||
      form.gxpRationale !== changeImpactParsed.gxp_classification.rationale);
  const isValidationModified =
    !!changeImpactParsed &&
    (form.validatedStateAffected !==
      changeImpactParsed.data_validation_impact.validated_state_affected ||
      form.dataValidationRationale !==
        changeImpactParsed.data_validation_impact.rationale);
  const isRiskModified =
    !!changeImpactParsed &&
    (form.riskLevel !== changeImpactParsed.risk_scoring.level ||
      form.riskRationale !== changeImpactParsed.risk_scoring.rationale);
  const isSystemsModified =
    !!changeImpactParsed &&
    JSON.stringify(form.impactedSystems) !==
      JSON.stringify(changeImpactParsed.impacted_systems);
  const isDependenciesModified =
    !!changeImpactParsed &&
    JSON.stringify(form.downstreamDependencies) !==
      JSON.stringify(changeImpactParsed.downstream_dependencies);

  return {
    // guard inputs
    result,
    classificationParsed,
    changeImpactParsed,
    chatOpen,
    setChatOpen,
    impactedSystems: form.impactedSystems,
    setImpactedSystems,
    downstreamDependencies: form.downstreamDependencies,
    setDownstreamDependencies,
    gxpValue: form.gxpValue,
    gxpRationale: form.gxpRationale,
    validatedStateAffected: form.validatedStateAffected,
    dataValidationRationale: form.dataValidationRationale,
    riskLevel: form.riskLevel,
    riskRationale: form.riskRationale,
    updateGxpValue,
    updateGxpRationale,
    updateValidatedStateAffected,
    updateDataValidationRationale,
    updateRiskLevel,
    updateRiskRationale,
    gxpChangedWithoutRationale: form.gxpChangedWithoutRationale,
    validationChangedWithoutRationale: form.validationChangedWithoutRationale,
    riskChangedWithoutRationale: form.riskChangedWithoutRationale,
    isGxpModified,
    isValidationModified,
    isRiskModified,
    isSystemsModified,
    isDependenciesModified,
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,
    showRationaleWarning: override.showRationaleWarning,
    setShowRationaleWarning: override.setShowRationaleWarning,
    warningFields: override.warningFields,
    isSubmitting: override.isSubmitting,
    submitError: override.submitError,
    handleAccept,
    handleReject,
    handleGetAiSuggestion,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    llmFailure,
  };
}
