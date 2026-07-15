import { useCallback, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { generateRiskCriticality } from "../../services/changeControl/riskCriticalityApi";
import {
  aiField,
  markModified,
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

// ---------------------------------------------------------------------------
// Form reducer: the editable change-impact fields, previously 13 separate
// useState calls. See useRiskCriticality.ts for the same pattern applied
// to its sibling page.
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
  | { type: "SET_RISK_RATIONALE"; value: string; original: string };

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

  const buildChangeImpactProvenance = (
    confirmed: boolean,
  ): ChangeImpactAssessmentProvenance => {
    const original = changeImpactParsed!;

    const impactedSystemsField =
      confirmed &&
      JSON.stringify(form.impactedSystems) !==
        JSON.stringify(original.impacted_systems)
        ? markModified(aiField(original.impacted_systems), form.impactedSystems)
        : aiField(original.impacted_systems);

    const downstreamDependenciesField =
      confirmed &&
      JSON.stringify(form.downstreamDependencies) !==
        JSON.stringify(original.downstream_dependencies)
        ? markModified(
            aiField(original.downstream_dependencies),
            form.downstreamDependencies,
          )
        : aiField(original.downstream_dependencies);

    const gxpValueField =
      confirmed && form.gxpValue !== original.gxp_classification.value
        ? markModified(
            aiField(original.gxp_classification.value),
            form.gxpValue,
          )
        : aiField(original.gxp_classification.value);

    const gxpRationaleField =
      confirmed && form.gxpRationale !== original.gxp_classification.rationale
        ? markModified(
            aiField(original.gxp_classification.rationale),
            form.gxpRationale,
          )
        : aiField(original.gxp_classification.rationale);

    const validatedStateField =
      confirmed &&
      form.validatedStateAffected !==
        original.data_validation_impact.validated_state_affected
        ? markModified(
            aiField(original.data_validation_impact.validated_state_affected),
            form.validatedStateAffected,
          )
        : aiField(original.data_validation_impact.validated_state_affected);

    const dataValidationRationaleField =
      confirmed &&
      form.dataValidationRationale !== original.data_validation_impact.rationale
        ? markModified(
            aiField(original.data_validation_impact.rationale),
            form.dataValidationRationale,
          )
        : aiField(original.data_validation_impact.rationale);

    const riskLevelField =
      confirmed && form.riskLevel !== original.risk_scoring.level
        ? markModified(aiField(original.risk_scoring.level), form.riskLevel)
        : aiField(original.risk_scoring.level);

    const riskRationaleField =
      confirmed && form.riskRationale !== original.risk_scoring.rationale
        ? markModified(
            aiField(original.risk_scoring.rationale),
            form.riskRationale,
          )
        : aiField(original.risk_scoring.rationale);

    return {
      impacted_systems: impactedSystemsField,
      gxp_classification: {
        value: gxpValueField,
        rationale: gxpRationaleField,
      },
      data_validation_impact: {
        validated_state_affected: validatedStateField,
        rationale: dataValidationRationaleField,
      },
      downstream_dependencies: downstreamDependenciesField,
      risk_scoring: {
        level: riskLevelField,
        rationale: riskRationaleField,
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
      override.submitFailure(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the change impact assessment. Please try again.",
      );
    }
  };

  const handleAccept = () => {
    const changeImpactProvenance = buildChangeImpactProvenance(
      override.overrideConfirmed,
    );
    const existingRiskCriticality = result!.stages?.riskCriticality;
    if (!override.overrideConfirmed && existingRiskCriticality?.parsed) {
      navigateToRiskCriticality(
        existingRiskCriticality,
        changeImpactProvenance,
        buildApprovedChangeImpactAssessment(),
      );
      return;
    }
    void submitChangeImpactAssessment(changeImpactProvenance);
  };

  const handleOverrideClick = () => override.setIsOverrideEditing(true);

  const handleSaveChanges = () => {
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
    override.setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!changeImpactParsed) return;
    override.setIsOverrideEditing(false);
    dispatchForm({ type: "HYDRATE", parsed: changeImpactParsed });
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

  const isGxpModified =
    !!changeImpactParsed &&
    override.overrideConfirmed &&
    (form.gxpValue !== changeImpactParsed.gxp_classification.value ||
      form.gxpRationale !== changeImpactParsed.gxp_classification.rationale);
  const isValidationModified =
    !!changeImpactParsed &&
    override.overrideConfirmed &&
    (form.validatedStateAffected !==
      changeImpactParsed.data_validation_impact.validated_state_affected ||
      form.dataValidationRationale !==
        changeImpactParsed.data_validation_impact.rationale);
  const isRiskModified =
    !!changeImpactParsed &&
    override.overrideConfirmed &&
    (form.riskLevel !== changeImpactParsed.risk_scoring.level ||
      form.riskRationale !== changeImpactParsed.risk_scoring.rationale);
  const isSystemsModified =
    !!changeImpactParsed &&
    override.overrideConfirmed &&
    JSON.stringify(form.impactedSystems) !==
      JSON.stringify(changeImpactParsed.impacted_systems);
  const isDependenciesModified =
    !!changeImpactParsed &&
    override.overrideConfirmed &&
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

    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}
