import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
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
// NOTE: these live at src/app/utils/, i.e. two levels up from
// src/app/hooks/changeControl/ — not three. The page this hook was
// extracted from had `../../../utils/...` (three levels), which resolves
// to a nonexistent `src/utils/` and fails to build. Fixed here.
import { nestedToFlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import {
  flatToNestedImplementationControl,
  nestedToFlatValidationTesting,
} from "../../utils/changeControlAdapters";

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

  // Editable form state, seeded from the AI-generated values
  const [level, setLevel] = useState<ValidationLevel>(
    validationParsed?.required_validation_level.level ?? "None",
  );
  const [levelRationale, setLevelRationale] = useState(
    validationParsed?.required_validation_level.rationale ?? "",
  );
  const [scenarioTesting, setScenarioTesting] = useState(
    linesToText(validationParsed?.scenario_based_testing ?? []),
  );
  const [regressionScope, setRegressionScope] = useState(
    linesToText(validationParsed?.regression_scope ?? []),
  );
  const [uatRequirements, setUatRequirements] = useState(
    linesToText(validationParsed?.uat_requirements ?? []),
  );
  const [traceability, setTraceability] = useState(
    linesToText(validationParsed?.traceability ?? []),
  );

  // "Changed the value but not the rationale" tracking (level field only —
  // the list fields below don't carry a separate rationale sub-field).
  const [levelChangedWithoutRationale, setLevelChangedWithoutRationale] =
    useState(false);

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showRationaleWarning, setShowRationaleWarning] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-hydrate local editable state whenever a *new* validation strategy
  // lands in the store (mirrors RiskCriticality.tsx / ImplementationControl.tsx).
  useEffect(() => {
    if (!validationParsed) return;
    setLevel(validationParsed.required_validation_level.level);
    setLevelRationale(validationParsed.required_validation_level.rationale);
    setScenarioTesting(linesToText(validationParsed.scenario_based_testing));
    setRegressionScope(linesToText(validationParsed.regression_scope));
    setUatRequirements(linesToText(validationParsed.uat_requirements));
    setTraceability(linesToText(validationParsed.traceability));
    setLevelChangedWithoutRationale(false);
    setOverrideConfirmed(false);
    setIsOverrideEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationParsed]);

  // Field update helpers
  const updateLevel = (value: string) => {
    if (!validationParsed) return;
    setLevel(value as ValidationLevel);
    setLevelChangedWithoutRationale(
      value !== validationParsed.required_validation_level.level,
    );
  };
  const updateLevelRationale = (value: string) => {
    setLevelRationale(value);
    if (
      validationParsed &&
      value !== validationParsed.required_validation_level.rationale
    ) {
      setLevelChangedWithoutRationale(false);
    }
  };

  // Approved validation testing — 1:1 with ValidationTestingParsed
  const buildApprovedValidationTesting = (): ValidationTestingParsed => ({
    ...validationParsed!,
    required_validation_level: { level, rationale: levelRationale },
    scenario_based_testing: parseLines(scenarioTesting),
    regression_scope: parseLines(regressionScope),
    uat_requirements: parseLines(uatRequirements),
    traceability: parseLines(traceability),
  });

  const buildValidationProvenance = (
    confirmed: boolean,
  ): ValidationTestingProvenance => {
    const original = validationParsed!;

    const levelField =
      confirmed && level !== original.required_validation_level.level
        ? markModified(aiField(original.required_validation_level.level), level)
        : aiField(original.required_validation_level.level);
    const levelRationaleField =
      confirmed &&
      levelRationale !== original.required_validation_level.rationale
        ? markModified(
            aiField(original.required_validation_level.rationale),
            levelRationale,
          )
        : aiField(original.required_validation_level.rationale);

    const currentScenarios = parseLines(scenarioTesting);
    const scenarioField =
      confirmed &&
      JSON.stringify(currentScenarios) !==
        JSON.stringify(original.scenario_based_testing)
        ? markModified(
            aiField(original.scenario_based_testing),
            currentScenarios,
          )
        : aiField(original.scenario_based_testing);

    const currentRegression = parseLines(regressionScope);
    const regressionField =
      confirmed &&
      JSON.stringify(currentRegression) !==
        JSON.stringify(original.regression_scope)
        ? markModified(aiField(original.regression_scope), currentRegression)
        : aiField(original.regression_scope);

    const currentUat = parseLines(uatRequirements);
    const uatField =
      confirmed &&
      JSON.stringify(currentUat) !== JSON.stringify(original.uat_requirements)
        ? markModified(aiField(original.uat_requirements), currentUat)
        : aiField(original.uat_requirements);

    const currentTraceability = parseLines(traceability);
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
    setSubmitError(null);
    setIsSubmitting(true);
    const approvedValidationTesting = buildApprovedValidationTesting();
    try {
      // Backend expects the flat LLM-schema shape for the upstream approved
      // stages, and returns implementationControl.parsed in that same flat
      // shape — flatten going out, nest coming back in.
      const rawImplementationResult: any = await apiFetch(
        "/api/change-control/implementation-control",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            changeImpactAssessment:
              nestedToFlatChangeImpactAssessment(impactParsed!),
            riskCriticality: riskParsed,
            validationTesting: nestedToFlatValidationTesting(
              approvedValidationTesting,
            ),
          }),
        },
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
      navigateToImplementation(
        implementationControlStage,
        validationProvenance,
        approvedValidationTesting,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the validation & testing strategy. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    const validationProvenance = buildValidationProvenance(overrideConfirmed);
    const existingImplementation = result!.stages?.implementationControl;
    if (!overrideConfirmed && existingImplementation?.parsed) {
      navigateToImplementation(
        existingImplementation,
        validationProvenance,
        buildApprovedValidationTesting(),
      );
      return;
    }
    void submitValidationTesting(validationProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    if (levelChangedWithoutRationale) {
      setShowRationaleWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!validationParsed) return;
    setIsOverrideEditing(false);
    setLevel(validationParsed.required_validation_level.level);
    setLevelRationale(validationParsed.required_validation_level.rationale);
    setScenarioTesting(linesToText(validationParsed.scenario_based_testing));
    setRegressionScope(linesToText(validationParsed.regression_scope));
    setUatRequirements(linesToText(validationParsed.uat_requirements));
    setTraceability(linesToText(validationParsed.traceability));
    setLevelChangedWithoutRationale(false);
  };

  const handleOverrideConfirm = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  const isLevelModified =
    !!validationParsed &&
    overrideConfirmed &&
    (level !== validationParsed.required_validation_level.level ||
      levelRationale !== validationParsed.required_validation_level.rationale);

  return {
    // guard inputs
    result,
    classificationParsed,
    impactParsed,
    riskParsed,
    validationParsed,

    chatOpen,
    setChatOpen,

    level,
    levelRationale,
    scenarioTesting,
    setScenarioTesting,
    regressionScope,
    setRegressionScope,
    uatRequirements,
    setUatRequirements,
    traceability,
    setTraceability,
    updateLevel,
    updateLevelRationale,

    levelChangedWithoutRationale,
    isLevelModified,

    isOverrideEditing,
    overrideConfirmed,

    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    showRationaleWarning,
    setShowRationaleWarning,

    isSubmitting,
    submitError,

    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}