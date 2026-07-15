import { useCallback, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { generateImplementationControl } from "../../services/changeControl/implementationControlApi";
import {
  aiField,
  markModified,
  type ValidationTestingProvenance,
} from "../../types/dataProvenance";
import type {
  ImplementationControlApiResponse,
  ValidationLevel,
  ValidationTestingParsed,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { nestedToFlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import {
  flatToNestedImplementationControl,
  nestedToFlatValidationTesting,
} from "../../utils/changeControlAdapters";
import { useOverrideDialogState } from "../shared/useOverRideDialogState";

// Helpers — mirrors the list <-> textarea convention used on
// RiskCriticality.tsx / ImplementationControl.tsx
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Form reducer: the 7 editable fields, previously 7 separate useState calls.
// Same pattern as useRiskCriticality.ts / useChangeImpactAssessmentReview.ts.
// ---------------------------------------------------------------------------
interface ValidationFormState {
  level: ValidationLevel;
  levelRationale: string;
  scenarioTesting: string;
  regressionScope: string;
  uatRequirements: string;
  traceability: string;
  levelChangedWithoutRationale: boolean;
}

type ValidationFormAction =
  | { type: "HYDRATE"; parsed: ValidationTestingParsed }
  | { type: "SET_LEVEL"; value: ValidationLevel; original: ValidationLevel }
  | { type: "SET_LEVEL_RATIONALE"; value: string; original: string }
  | { type: "SET_SCENARIO_TESTING"; value: string }
  | { type: "SET_REGRESSION_SCOPE"; value: string }
  | { type: "SET_UAT_REQUIREMENTS"; value: string }
  | { type: "SET_TRACEABILITY"; value: string };

const initialValidationFormState: ValidationFormState = {
  level: "None",
  levelRationale: "",
  scenarioTesting: "",
  regressionScope: "",
  uatRequirements: "",
  traceability: "",
  levelChangedWithoutRationale: false,
};

function hydrateValidationForm(
  parsed: ValidationTestingParsed,
): ValidationFormState {
  return {
    level: parsed.required_validation_level.level,
    levelRationale: parsed.required_validation_level.rationale,
    scenarioTesting: linesToText(parsed.scenario_based_testing),
    regressionScope: linesToText(parsed.regression_scope),
    uatRequirements: linesToText(parsed.uat_requirements),
    traceability: linesToText(parsed.traceability),
    levelChangedWithoutRationale: false,
  };
}

function validationFormReducer(
  state: ValidationFormState,
  action: ValidationFormAction,
): ValidationFormState {
  switch (action.type) {
    case "HYDRATE":
      return hydrateValidationForm(action.parsed);
    case "SET_LEVEL":
      return {
        ...state,
        level: action.value,
        levelChangedWithoutRationale: action.value !== action.original,
      };
    case "SET_LEVEL_RATIONALE":
      return {
        ...state,
        levelRationale: action.value,
        levelChangedWithoutRationale:
          action.value !== action.original
            ? false
            : state.levelChangedWithoutRationale,
      };
    case "SET_SCENARIO_TESTING":
      return { ...state, scenarioTesting: action.value };
    case "SET_REGRESSION_SCOPE":
      return { ...state, regressionScope: action.value };
    case "SET_UAT_REQUIREMENTS":
      return { ...state, uatRequirements: action.value };
    case "SET_TRACEABILITY":
      return { ...state, traceability: action.value };
    default:
      return state;
  }
}

export function useValidationTestingReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const validationParsed = result?.stages?.validationTesting?.parsed ?? null;

  const [form, dispatchForm] = useReducer(
    validationFormReducer,
    initialValidationFormState,
  );
  const override = useOverrideDialogState();

  // Re-hydrate local editable state whenever a *new* validation strategy
  // lands in the store (mirrors RiskCriticality.tsx / ImplementationControl.tsx).
  useEffect(() => {
    if (!validationParsed) return;
    dispatchForm({ type: "HYDRATE", parsed: validationParsed });
    override.resetOnHydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationParsed]);

  // Field update helpers
  const updateLevel = useCallback(
    (value: string) => {
      if (!validationParsed) return;
      dispatchForm({
        type: "SET_LEVEL",
        value: value as ValidationLevel,
        original: validationParsed.required_validation_level.level,
      });
    },
    [validationParsed],
  );
  const updateLevelRationale = useCallback(
    (value: string) => {
      if (!validationParsed) return;
      dispatchForm({
        type: "SET_LEVEL_RATIONALE",
        value,
        original: validationParsed.required_validation_level.rationale,
      });
    },
    [validationParsed],
  );
  const setScenarioTesting = useCallback(
    (value: string) => dispatchForm({ type: "SET_SCENARIO_TESTING", value }),
    [],
  );
  const setRegressionScope = useCallback(
    (value: string) => dispatchForm({ type: "SET_REGRESSION_SCOPE", value }),
    [],
  );
  const setUatRequirements = useCallback(
    (value: string) => dispatchForm({ type: "SET_UAT_REQUIREMENTS", value }),
    [],
  );
  const setTraceability = useCallback(
    (value: string) => dispatchForm({ type: "SET_TRACEABILITY", value }),
    [],
  );

  // Approved validation testing — 1:1 with ValidationTestingParsed
  const buildApprovedValidationTesting = (): ValidationTestingParsed => ({
    ...validationParsed!,
    required_validation_level: {
      level: form.level,
      rationale: form.levelRationale,
    },
    scenario_based_testing: parseLines(form.scenarioTesting),
    regression_scope: parseLines(form.regressionScope),
    uat_requirements: parseLines(form.uatRequirements),
    traceability: parseLines(form.traceability),
  });

  const buildValidationProvenance = (
    confirmed: boolean,
  ): ValidationTestingProvenance => {
    const original = validationParsed!;

    const levelField =
      confirmed && form.level !== original.required_validation_level.level
        ? markModified(
            aiField(original.required_validation_level.level),
            form.level,
          )
        : aiField(original.required_validation_level.level);
    const levelRationaleField =
      confirmed &&
      form.levelRationale !== original.required_validation_level.rationale
        ? markModified(
            aiField(original.required_validation_level.rationale),
            form.levelRationale,
          )
        : aiField(original.required_validation_level.rationale);

    const currentScenarios = parseLines(form.scenarioTesting);
    const scenarioField =
      confirmed &&
      JSON.stringify(currentScenarios) !==
        JSON.stringify(original.scenario_based_testing)
        ? markModified(
            aiField(original.scenario_based_testing),
            currentScenarios,
          )
        : aiField(original.scenario_based_testing);

    const currentRegression = parseLines(form.regressionScope);
    const regressionField =
      confirmed &&
      JSON.stringify(currentRegression) !==
        JSON.stringify(original.regression_scope)
        ? markModified(aiField(original.regression_scope), currentRegression)
        : aiField(original.regression_scope);

    const currentUat = parseLines(form.uatRequirements);
    const uatField =
      confirmed &&
      JSON.stringify(currentUat) !== JSON.stringify(original.uat_requirements)
        ? markModified(aiField(original.uat_requirements), currentUat)
        : aiField(original.uat_requirements);

    const currentTraceability = parseLines(form.traceability);
    const traceabilityField =
      confirmed &&
      JSON.stringify(currentTraceability) !==
        JSON.stringify(original.traceability)
        ? markModified(aiField(original.traceability), currentTraceability)
        : aiField(original.traceability);

    return {
      required_validation_level: {
        level: levelField,
        rationale: levelRationaleField,
      },
      scenario_based_testing: scenarioField,
      regression_scope: regressionField,
      uat_requirements: uatField,
      traceability: traceabilityField,
      confidence_score: original.confidence_score,
    };
  };

  const navigateToImplementation = (
    implementationControlStage: ImplementationControlApiResponse["stages"]["implementationControl"],
    validationProvenance: ValidationTestingProvenance,
    approvedValidationTesting: ValidationTestingParsed,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        validationTesting: {
          ...result!.stages.validationTesting!,
          parsed: approvedValidationTesting,
        },
        implementationControl: implementationControlStage,
      },
      provenance: {
        ...result!.provenance,
        validationTesting: validationProvenance,
      },
    });
    navigate("/change-control/implementation");
  };

  const submitValidationTesting = async (
    validationProvenance: ValidationTestingProvenance,
  ) => {
    override.submitStart();
    const approvedValidationTesting = buildApprovedValidationTesting();
    try {
      // Backend expects the flat LLM-schema shape for the upstream approved
      // stages, and returns implementationControl.parsed in that same flat
      // shape — flatten going out, nest coming back in.
      const rawImplementationResult = await generateImplementationControl(
        result!.query,
        nestedToFlatChangeImpactAssessment(impactParsed!),
        riskParsed,
        nestedToFlatValidationTesting(approvedValidationTesting),
      );
      const rawStage = rawImplementationResult?.stages?.implementationControl;
      const implementationControlStage: ImplementationControlApiResponse["stages"]["implementationControl"] =
        rawStage
          ? {
              ...rawStage,
              parsed: rawStage.parsed
                ? flatToNestedImplementationControl(rawStage.parsed)
                : null,
            }
          : undefined;
      override.submitSuccess();
      navigateToImplementation(
        implementationControlStage,
        validationProvenance,
        approvedValidationTesting,
      );
    } catch (err) {
      override.submitFailure(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the validation & testing strategy. Please try again.",
      );
    }
  };

  const handleAccept = () => {
    const validationProvenance = buildValidationProvenance(
      override.overrideConfirmed,
    );
    const existingImplementation = result!.stages?.implementationControl;
    if (!override.overrideConfirmed && existingImplementation?.parsed) {
      navigateToImplementation(
        existingImplementation,
        validationProvenance,
        buildApprovedValidationTesting(),
      );
      return;
    }
    void submitValidationTesting(validationProvenance);
  };

  const handleOverrideClick = () => override.setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    if (form.levelChangedWithoutRationale) {
      override.setShowRationaleWarning(true);
      return;
    }
    override.setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!validationParsed) return;
    override.setIsOverrideEditing(false);
    dispatchForm({ type: "HYDRATE", parsed: validationParsed });
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

  const isLevelModified =
    !!validationParsed &&
    override.overrideConfirmed &&
    (form.level !== validationParsed.required_validation_level.level ||
      form.levelRationale !==
        validationParsed.required_validation_level.rationale);

  return {
    // guard inputs
    result,
    classificationParsed,
    impactParsed,
    riskParsed,
    validationParsed,

    chatOpen,
    setChatOpen,

    level: form.level,
    levelRationale: form.levelRationale,
    scenarioTesting: form.scenarioTesting,
    setScenarioTesting,
    regressionScope: form.regressionScope,
    setRegressionScope,
    uatRequirements: form.uatRequirements,
    setUatRequirements,
    traceability: form.traceability,
    setTraceability,
    updateLevel,
    updateLevelRationale,

    levelChangedWithoutRationale: form.levelChangedWithoutRationale,
    isLevelModified,

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
