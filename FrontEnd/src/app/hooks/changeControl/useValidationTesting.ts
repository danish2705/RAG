import { useCallback, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { generateImplementationControl } from "../../services/changeControl/implementationControlApi";
import {
  autoField,
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
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

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
// Every field is directly editable at all times — seeded from the AI output
// but freely changeable without first entering any separate "override" mode.
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
  | { type: "SET_TRACEABILITY"; value: string }
  | { type: "CLEAR" };

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
    case "CLEAR":
      return initialValidationFormState;
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
  const llmFailure = useLlmFailureRecovery();
  // Only surfaced after the user rejects the strategy (and the fields get
  // cleared) — hidden otherwise.
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  // Client-side check so an accidental Accept right after Reject clears the
  // fields doesn't silently save empty data to the audit trail.
  const [emptyFieldsWarning, setEmptyFieldsWarning] = useState<string | null>(
    null,
  );

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

  const buildValidationProvenance = (): ValidationTestingProvenance => {
    const original = validationParsed!;

    return {
      required_validation_level: {
        level: autoField(
          original.required_validation_level.level,
          form.level,
        ),
        rationale: autoField(
          original.required_validation_level.rationale,
          form.levelRationale,
        ),
      },
      scenario_based_testing: autoField(
        original.scenario_based_testing,
        parseLines(form.scenarioTesting),
      ),
      regression_scope: autoField(
        original.regression_scope,
        parseLines(form.regressionScope),
      ),
      uat_requirements: autoField(
        original.uat_requirements,
        parseLines(form.uatRequirements),
      ),
      traceability: autoField(
        original.traceability,
        parseLines(form.traceability),
      ),
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
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the validation & testing strategy. Please try again.";
      override.submitFailure(message);
      // `result` predates this Accept — patch in the just-approved
      // validation & testing strategy so Resume doesn't lose the approval
      // just made.
      const patchedResult = result
        ? {
            ...result,
            stages: {
              ...result.stages,
              validationTesting: {
                ...result.stages.validationTesting!,
                parsed: approvedValidationTesting,
              },
            },
            provenance: {
              ...result.provenance,
              validationTesting: validationProvenance,
            },
          }
        : null;
      llmFailure.openLlmFailureDialog({
        entityType: "Change Control",
        pipelineStage: "implementation_control",
        queryText: result!.query,
        errorMessage: message,
        pipelineContext: patchedResult,
      });
    }
  };

  // Accept stays disabled until every field is filled in — most notably
  // right after a Reject clears them.
  const canAccept =
    form.levelRationale.trim() !== "" &&
    form.scenarioTesting.trim() !== "" &&
    form.regressionScope.trim() !== "" &&
    form.uatRequirements.trim() !== "" &&
    form.traceability.trim() !== "";

  const handleAccept = () => {
    // If the validation level was changed but its rationale wasn't updated
    // to explain why, block Accept and ask for that first — same guardrail
    // that used to live in the old "Save Changes" step, just triggered by
    // Accept directly now that there's no separate override mode.
    if (form.levelChangedWithoutRationale) {
      override.setShowRationaleWarning(true);
      return;
    }

    // Guard against accepting right after a Reject cleared the fields —
    // don't silently save empty data to the audit trail.
    if (
      form.levelRationale.trim() === "" ||
      form.scenarioTesting.trim() === "" ||
      form.regressionScope.trim() === "" ||
      form.uatRequirements.trim() === "" ||
      form.traceability.trim() === ""
    ) {
      setEmptyFieldsWarning(
        "One or more validation & testing fields are empty. Please fill them in before accepting.",
      );
      return;
    }
    setEmptyFieldsWarning(null);

    const validationProvenance = buildValidationProvenance();
    const isEdited = [
      validationProvenance.required_validation_level.level,
      validationProvenance.required_validation_level.rationale,
      validationProvenance.scenario_based_testing,
      validationProvenance.regression_scope,
      validationProvenance.uat_requirements,
      validationProvenance.traceability,
    ].some((field) => field.source === "modified");

    const existingImplementation = result!.stages?.implementationControl;
    if (!isEdited && existingImplementation?.parsed) {
      navigateToImplementation(
        existingImplementation,
        validationProvenance,
        buildApprovedValidationTesting(),
      );
      return;
    }
    void submitValidationTesting(validationProvenance);
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

  // Restores the original AI-generated strategy into the form — used by
  // the "AI Suggestion" button so a rejected/cleared field can be brought
  // back.
  const handleGetAiSuggestion = () => {
    if (!validationParsed) return;
    dispatchForm({ type: "HYDRATE", parsed: validationParsed });
  };

  const isLevelModified =
    !!validationParsed &&
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
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,
    showRationaleWarning: override.showRationaleWarning,
    setShowRationaleWarning: override.setShowRationaleWarning,
    isSubmitting: override.isSubmitting,
    submitError: override.submitError,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    llmFailure,
    handleAccept,
    handleReject,
    handleGetAiSuggestion,
  };
}
