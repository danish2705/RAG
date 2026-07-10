import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
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

// Helpers — mirrors the list <-> textarea convention used on
// RiskCriticality.tsx / ValidationTesting.tsx
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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

  // Editable form state, seeded from the AI-generated values
  const [impactedSystems, setImpactedSystems] = useState<string[]>(
    changeImpactParsed?.impacted_systems ?? [],
  );
  const [downstreamDependencies, setDownstreamDependencies] = useState<
    string[]
  >(changeImpactParsed?.downstream_dependencies ?? []);
  const [gxpValue, setGxpValue] = useState<GxpClassification>(
    changeImpactParsed?.gxp_classification.value ?? "Indirect Impact",
  );
  const [gxpRationale, setGxpRationale] = useState(
    changeImpactParsed?.gxp_classification.rationale ?? "",
  );
  const [validatedStateAffected, setValidatedStateAffected] = useState(
    changeImpactParsed?.data_validation_impact.validated_state_affected ??
      false,
  );
  const [dataValidationRationale, setDataValidationRationale] = useState(
    changeImpactParsed?.data_validation_impact.rationale ?? "",
  );
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    changeImpactParsed?.risk_scoring.level ?? "Low",
  );
  const [riskRationale, setRiskRationale] = useState(
    changeImpactParsed?.risk_scoring.rationale ?? "",
  );

  // "Changed the value but not the rationale" tracking
  const [gxpChangedWithoutRationale, setGxpChangedWithoutRationale] =
    useState(false);
  const [
    validationChangedWithoutRationale,
    setValidationChangedWithoutRationale,
  ] = useState(false);
  const [riskChangedWithoutRationale, setRiskChangedWithoutRationale] =
    useState(false);

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showRationaleWarning, setShowRationaleWarning] = useState(false);
  const [warningFields, setWarningFields] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Field update helpers
  const updateGxpValue = (value: string) => {
    if (!changeImpactParsed) return;
    setGxpValue(value as GxpClassification);
    setGxpChangedWithoutRationale(
      value !== changeImpactParsed.gxp_classification.value,
    );
  };

  const updateGxpRationale = (value: string) => {
    setGxpRationale(value);
    if (
      changeImpactParsed &&
      value !== changeImpactParsed.gxp_classification.rationale
    ) {
      setGxpChangedWithoutRationale(false);
    }
  };

  const updateValidatedStateAffected = (value: string) => {
    if (!changeImpactParsed) return;
    const next = value === "true";
    setValidatedStateAffected(next);
    setValidationChangedWithoutRationale(
      next !==
        changeImpactParsed.data_validation_impact.validated_state_affected,
    );
  };

  const updateDataValidationRationale = (value: string) => {
    setDataValidationRationale(value);
    if (
      changeImpactParsed &&
      value !== changeImpactParsed.data_validation_impact.rationale
    ) {
      setValidationChangedWithoutRationale(false);
    }
  };

  const updateRiskLevel = (value: string) => {
    if (!changeImpactParsed) return;
    setRiskLevel(value as RiskLevel);
    setRiskChangedWithoutRationale(
      value !== changeImpactParsed.risk_scoring.level,
    );
  };

  const updateRiskRationale = (value: string) => {
    setRiskRationale(value);
    if (
      changeImpactParsed &&
      value !== changeImpactParsed.risk_scoring.rationale
    ) {
      setRiskChangedWithoutRationale(false);
    }
  };

  const buildApprovedChangeImpactAssessment =
    (): ChangeImpactAssessmentParsed => ({
      ...changeImpactParsed!,
      impacted_systems: impactedSystems,
      gxp_classification: { value: gxpValue, rationale: gxpRationale },
      data_validation_impact: {
        validated_state_affected: validatedStateAffected,
        rationale: dataValidationRationale,
      },
      downstream_dependencies: downstreamDependencies,
      risk_scoring: { level: riskLevel, rationale: riskRationale },
    });

  const buildChangeImpactProvenance = (
    confirmed: boolean,
  ): ChangeImpactAssessmentProvenance => {
    const original = changeImpactParsed!;

    const impactedSystemsField =
      confirmed &&
      JSON.stringify(impactedSystems) !==
        JSON.stringify(original.impacted_systems)
        ? markModified(aiField(original.impacted_systems), impactedSystems)
        : aiField(original.impacted_systems);

    const downstreamDependenciesField =
      confirmed &&
      JSON.stringify(downstreamDependencies) !==
        JSON.stringify(original.downstream_dependencies)
        ? markModified(
            aiField(original.downstream_dependencies),
            downstreamDependencies,
          )
        : aiField(original.downstream_dependencies);

    const gxpValueField =
      confirmed && gxpValue !== original.gxp_classification.value
        ? markModified(aiField(original.gxp_classification.value), gxpValue)
        : aiField(original.gxp_classification.value);

    const gxpRationaleField =
      confirmed && gxpRationale !== original.gxp_classification.rationale
        ? markModified(
            aiField(original.gxp_classification.rationale),
            gxpRationale,
          )
        : aiField(original.gxp_classification.rationale);

    const validatedStateField =
      confirmed &&
      validatedStateAffected !==
        original.data_validation_impact.validated_state_affected
        ? markModified(
            aiField(original.data_validation_impact.validated_state_affected),
            validatedStateAffected,
          )
        : aiField(original.data_validation_impact.validated_state_affected);

    const dataValidationRationaleField =
      confirmed &&
      dataValidationRationale !== original.data_validation_impact.rationale
        ? markModified(
            aiField(original.data_validation_impact.rationale),
            dataValidationRationale,
          )
        : aiField(original.data_validation_impact.rationale);

    const riskLevelField =
      confirmed && riskLevel !== original.risk_scoring.level
        ? markModified(aiField(original.risk_scoring.level), riskLevel)
        : aiField(original.risk_scoring.level);

    const riskRationaleField =
      confirmed && riskRationale !== original.risk_scoring.rationale
        ? markModified(aiField(original.risk_scoring.rationale), riskRationale)
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
    setSubmitError(null);
    setIsSubmitting(true);
    const approvedChangeImpactAssessment =
      buildApprovedChangeImpactAssessment();
    const flatChangeImpactAssessment = nestedToFlatChangeImpactAssessment(
      approvedChangeImpactAssessment,
    );
    try {
      const riskResult: RiskCriticalityApiResponse = await apiFetch(
        "/api/change-control/risk-criticality",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            classification: classificationParsed,
            changeImpactAssessment: flatChangeImpactAssessment,
          }),
        },
      );
      navigateToRiskCriticality(
        riskResult.stages.riskCriticality,
        changeImpactProvenance,
        approvedChangeImpactAssessment,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the change impact assessment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    const changeImpactProvenance =
      buildChangeImpactProvenance(overrideConfirmed);
    const existingRiskCriticality = result!.stages?.riskCriticality;
    if (!overrideConfirmed && existingRiskCriticality?.parsed) {
      navigateToRiskCriticality(
        existingRiskCriticality,
        changeImpactProvenance,
        buildApprovedChangeImpactAssessment(),
      );
      return;
    }
    void submitChangeImpactAssessment(changeImpactProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsRationale: string[] = [];
    if (gxpChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.gxp_classification);
    if (validationChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.data_validation_impact);
    if (riskChangedWithoutRationale)
      needsRationale.push(CHANGE_IMPACT_FIELD_LABELS.risk_scoring);

    if (needsRationale.length > 0) {
      setWarningFields(needsRationale);
      setShowRationaleWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!changeImpactParsed) return;
    setIsOverrideEditing(false);
    setImpactedSystems(changeImpactParsed.impacted_systems);
    setDownstreamDependencies(changeImpactParsed.downstream_dependencies);
    setGxpValue(changeImpactParsed.gxp_classification.value);
    setGxpRationale(changeImpactParsed.gxp_classification.rationale);
    setValidatedStateAffected(
      changeImpactParsed.data_validation_impact.validated_state_affected,
    );
    setDataValidationRationale(
      changeImpactParsed.data_validation_impact.rationale,
    );
    setRiskLevel(changeImpactParsed.risk_scoring.level);
    setRiskRationale(changeImpactParsed.risk_scoring.rationale);
    setGxpChangedWithoutRationale(false);
    setValidationChangedWithoutRationale(false);
    setRiskChangedWithoutRationale(false);
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

  const isGxpModified =
    !!changeImpactParsed &&
    overrideConfirmed &&
    (gxpValue !== changeImpactParsed.gxp_classification.value ||
      gxpRationale !== changeImpactParsed.gxp_classification.rationale);
  const isValidationModified =
    !!changeImpactParsed &&
    overrideConfirmed &&
    (validatedStateAffected !==
      changeImpactParsed.data_validation_impact.validated_state_affected ||
      dataValidationRationale !==
        changeImpactParsed.data_validation_impact.rationale);
  const isRiskModified =
    !!changeImpactParsed &&
    overrideConfirmed &&
    (riskLevel !== changeImpactParsed.risk_scoring.level ||
      riskRationale !== changeImpactParsed.risk_scoring.rationale);
  const isSystemsModified =
    !!changeImpactParsed &&
    overrideConfirmed &&
    JSON.stringify(impactedSystems) !==
      JSON.stringify(changeImpactParsed.impacted_systems);
  const isDependenciesModified =
    !!changeImpactParsed &&
    overrideConfirmed &&
    JSON.stringify(downstreamDependencies) !==
      JSON.stringify(changeImpactParsed.downstream_dependencies);

  return {
    // guard inputs
    result,
    classificationParsed,
    changeImpactParsed,

    chatOpen,
    setChatOpen,

    impactedSystems,
    setImpactedSystems,
    downstreamDependencies,
    setDownstreamDependencies,
    gxpValue,
    gxpRationale,
    validatedStateAffected,
    dataValidationRationale,
    riskLevel,
    riskRationale,
    updateGxpValue,
    updateGxpRationale,
    updateValidatedStateAffected,
    updateDataValidationRationale,
    updateRiskLevel,
    updateRiskRationale,

    gxpChangedWithoutRationale,
    validationChangedWithoutRationale,
    riskChangedWithoutRationale,

    isGxpModified,
    isValidationModified,
    isRiskModified,
    isSystemsModified,
    isDependenciesModified,

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
    warningFields,

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