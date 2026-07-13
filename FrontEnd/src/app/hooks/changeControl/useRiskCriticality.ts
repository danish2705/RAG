import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
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

// Field labels — mirrors CHANGE_IMPACT_FIELD_LABELS convention in mockImpactAssessment.ts
export const RISK_FIELD_LABELS = {
  patient_safety_product_quality_impact:
    "Patient Safety / Product Quality Impact",
  regulatory_impact: "Regulatory Impact",
  data_integrity_risk: "Data Integrity Risk",
  operational_disruption_risk: "Operational Disruption Risk",
} as const;

// Helpers
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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

  // Editable form state, seeded from the AI-generated values
  const [psLevel, setPsLevel] = useState<RiskLevel>(
    riskParsed?.patient_safety_product_quality_impact.level ?? "Low",
  );
  const [psRationale, setPsRationale] = useState(
    riskParsed?.patient_safety_product_quality_impact.rationale ?? "",
  );

  const [regLevel, setRegLevel] = useState<RiskLevel>(
    riskParsed?.regulatory_impact.level ?? "Low",
  );
  const [regFilings, setRegFilings] = useState<string[]>(
    riskParsed?.regulatory_impact.filings_or_submissions_affected ?? [],
  );
  const [regRationale, setRegRationale] = useState(
    riskParsed?.regulatory_impact.rationale ?? "",
  );

  const [diLevel, setDiLevel] = useState<RiskLevel>(
    riskParsed?.data_integrity_risk.level ?? "Low",
  );
  const [diRationale, setDiRationale] = useState(
    riskParsed?.data_integrity_risk.rationale ?? "",
  );

  const [odLevel, setOdLevel] = useState<RiskLevel>(
    riskParsed?.operational_disruption_risk.level ?? "Low",
  );
  const [odRationale, setOdRationale] = useState(
    riskParsed?.operational_disruption_risk.rationale ?? "",
  );

  const [rankingJustification, setRankingJustification] = useState(
    riskParsed?.risk_ranking_justification ?? "",
  );

  // "Changed the value but not the rationale" tracking
  const [psChangedWithoutRationale, setPsChangedWithoutRationale] =
    useState(false);
  const [regChangedWithoutRationale, setRegChangedWithoutRationale] =
    useState(false);
  const [diChangedWithoutRationale, setDiChangedWithoutRationale] =
    useState(false);
  const [odChangedWithoutRationale, setOdChangedWithoutRationale] =
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

  // Re-hydrate local editable state whenever a *new* risk evaluation lands
  // in the store. A plain useState initializer only runs on first mount —
  // if this page is already mounted (e.g. showing the "no data" fallback
  // below) when the API response arrives, that initializer is missed and
  // the form would stay blank forever without this effect.
  useEffect(() => {
    if (!riskParsed) return;
    setPsLevel(riskParsed.patient_safety_product_quality_impact.level);
    setPsRationale(riskParsed.patient_safety_product_quality_impact.rationale);
    setRegLevel(riskParsed.regulatory_impact.level);
    setRegFilings(riskParsed.regulatory_impact.filings_or_submissions_affected);
    setRegRationale(riskParsed.regulatory_impact.rationale);
    setDiLevel(riskParsed.data_integrity_risk.level);
    setDiRationale(riskParsed.data_integrity_risk.rationale);
    setOdLevel(riskParsed.operational_disruption_risk.level);
    setOdRationale(riskParsed.operational_disruption_risk.rationale);
    setRankingJustification(riskParsed.risk_ranking_justification);
    setPsChangedWithoutRationale(false);
    setRegChangedWithoutRationale(false);
    setDiChangedWithoutRationale(false);
    setOdChangedWithoutRationale(false);
    setOverrideConfirmed(false);
    setIsOverrideEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskParsed]);

  // Field update helpers
  const updatePsLevel = (value: string) => {
    if (!riskParsed) return;
    setPsLevel(value as RiskLevel);
    setPsChangedWithoutRationale(
      value !== riskParsed.patient_safety_product_quality_impact.level,
    );
  };
  const updatePsRationale = (value: string) => {
    setPsRationale(value);
    if (
      riskParsed &&
      value !== riskParsed.patient_safety_product_quality_impact.rationale
    ) {
      setPsChangedWithoutRationale(false);
    }
  };

  const updateRegLevel = (value: string) => {
    if (!riskParsed) return;
    setRegLevel(value as RiskLevel);
    setRegChangedWithoutRationale(value !== riskParsed.regulatory_impact.level);
  };
  const updateRegRationale = (value: string) => {
    setRegRationale(value);
    if (riskParsed && value !== riskParsed.regulatory_impact.rationale) {
      setRegChangedWithoutRationale(false);
    }
  };

  const updateDiLevel = (value: string) => {
    if (!riskParsed) return;
    setDiLevel(value as RiskLevel);
    setDiChangedWithoutRationale(
      value !== riskParsed.data_integrity_risk.level,
    );
  };
  const updateDiRationale = (value: string) => {
    setDiRationale(value);
    if (riskParsed && value !== riskParsed.data_integrity_risk.rationale) {
      setDiChangedWithoutRationale(false);
    }
  };

  const updateOdLevel = (value: string) => {
    if (!riskParsed) return;
    setOdLevel(value as RiskLevel);
    setOdChangedWithoutRationale(
      value !== riskParsed.operational_disruption_risk.level,
    );
  };
  const updateOdRationale = (value: string) => {
    setOdRationale(value);
    if (
      riskParsed &&
      value !== riskParsed.operational_disruption_risk.rationale
    ) {
      setOdChangedWithoutRationale(false);
    }
  };

  // Approved risk criticality — already 1:1 with backend's RiskCriticalitySchema
  // (unlike Stage 1, no flat/nested adapter is needed for this stage).
  const buildApprovedRiskCriticality = (): RiskCriticalityParsed | null =>
    riskParsed
      ? {
          ...riskParsed,
          patient_safety_product_quality_impact: {
            level: psLevel,
            rationale: psRationale,
          },
          regulatory_impact: {
            level: regLevel,
            filings_or_submissions_affected: regFilings,
            rationale: regRationale,
          },
          data_integrity_risk: { level: diLevel, rationale: diRationale },
          operational_disruption_risk: {
            level: odLevel,
            rationale: odRationale,
          },
          risk_ranking_justification: rankingJustification,
        }
      : null;

  const buildRiskProvenance = (
    confirmed: boolean,
  ): RiskCriticalityProvenance | null => {
    if (!riskParsed) return null;
    const original = riskParsed;

    const psLevelField =
      confirmed &&
      psLevel !== original.patient_safety_product_quality_impact.level
        ? markModified(
            aiField(original.patient_safety_product_quality_impact.level),
            psLevel,
          )
        : aiField(original.patient_safety_product_quality_impact.level);
    const psRationaleField =
      confirmed &&
      psRationale !== original.patient_safety_product_quality_impact.rationale
        ? markModified(
            aiField(original.patient_safety_product_quality_impact.rationale),
            psRationale,
          )
        : aiField(original.patient_safety_product_quality_impact.rationale);

    const regLevelField =
      confirmed && regLevel !== original.regulatory_impact.level
        ? markModified(aiField(original.regulatory_impact.level), regLevel)
        : aiField(original.regulatory_impact.level);
    const regFilingsField =
      confirmed &&
      JSON.stringify(regFilings) !==
        JSON.stringify(
          original.regulatory_impact.filings_or_submissions_affected,
        )
        ? markModified(
            aiField(original.regulatory_impact.filings_or_submissions_affected),
            regFilings,
          )
        : aiField(original.regulatory_impact.filings_or_submissions_affected);
    const regRationaleField =
      confirmed && regRationale !== original.regulatory_impact.rationale
        ? markModified(
            aiField(original.regulatory_impact.rationale),
            regRationale,
          )
        : aiField(original.regulatory_impact.rationale);

    const diLevelField =
      confirmed && diLevel !== original.data_integrity_risk.level
        ? markModified(aiField(original.data_integrity_risk.level), diLevel)
        : aiField(original.data_integrity_risk.level);
    const diRationaleField =
      confirmed && diRationale !== original.data_integrity_risk.rationale
        ? markModified(
            aiField(original.data_integrity_risk.rationale),
            diRationale,
          )
        : aiField(original.data_integrity_risk.rationale);

    const odLevelField =
      confirmed && odLevel !== original.operational_disruption_risk.level
        ? markModified(
            aiField(original.operational_disruption_risk.level),
            odLevel,
          )
        : aiField(original.operational_disruption_risk.level);
    const odRationaleField =
      confirmed &&
      odRationale !== original.operational_disruption_risk.rationale
        ? markModified(
            aiField(original.operational_disruption_risk.rationale),
            odRationale,
          )
        : aiField(original.operational_disruption_risk.rationale);

    const rankingField =
      confirmed && rankingJustification !== original.risk_ranking_justification
        ? markModified(
            aiField(original.risk_ranking_justification),
            rankingJustification,
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
    setSubmitError(null);
    setIsSubmitting(true);
    const approvedRiskCriticality = buildApprovedRiskCriticality()!;
    const flatChangeImpactAssessment =
      nestedToFlatChangeImpactAssessment(impactParsed);
    try {
      // The backend returns validationTesting.parsed in its flat LLM-schema
      // shape — convert to the nested shape the UI expects before it ever
      // touches the store/page.
      const rawValidationResult: any = await apiFetch(
        "/api/change-control/validation-testing",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            changeImpactAssessment: flatChangeImpactAssessment,
            riskCriticality: approvedRiskCriticality,
          }),
        },
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
      navigateToValidationTesting(
        validationTestingStage,
        riskProvenance,
        approvedRiskCriticality,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the risk & criticality evaluation. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    const riskProvenance = buildRiskProvenance(overrideConfirmed);
    if (!riskProvenance) return;
    const existingValidationTesting = result!.stages?.validationTesting;
    if (!overrideConfirmed && existingValidationTesting?.parsed) {
      navigateToValidationTesting(
        existingValidationTesting,
        riskProvenance,
        buildApprovedRiskCriticality()!,
      );
      return;
    }
    void submitRiskCriticality(riskProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsRationale: string[] = [];
    if (psChangedWithoutRationale)
      needsRationale.push(
        RISK_FIELD_LABELS.patient_safety_product_quality_impact,
      );
    if (regChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.regulatory_impact);
    if (diChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.data_integrity_risk);
    if (odChangedWithoutRationale)
      needsRationale.push(RISK_FIELD_LABELS.operational_disruption_risk);

    if (needsRationale.length > 0) {
      setWarningFields(needsRationale);
      setShowRationaleWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    if (!riskParsed) return;
    setIsOverrideEditing(false);
    setPsLevel(riskParsed.patient_safety_product_quality_impact.level);
    setPsRationale(riskParsed.patient_safety_product_quality_impact.rationale);
    setRegLevel(riskParsed.regulatory_impact.level);
    setRegFilings(riskParsed.regulatory_impact.filings_or_submissions_affected);
    setRegRationale(riskParsed.regulatory_impact.rationale);
    setDiLevel(riskParsed.data_integrity_risk.level);
    setDiRationale(riskParsed.data_integrity_risk.rationale);
    setOdLevel(riskParsed.operational_disruption_risk.level);
    setOdRationale(riskParsed.operational_disruption_risk.rationale);
    setRankingJustification(riskParsed.risk_ranking_justification);
    setPsChangedWithoutRationale(false);
    setRegChangedWithoutRationale(false);
    setDiChangedWithoutRationale(false);
    setOdChangedWithoutRationale(false);
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

  const confidenceScore = riskParsed?.confidence_score ?? 0;

  const isPsModified =
    !!riskParsed &&
    overrideConfirmed &&
    (psLevel !== riskParsed.patient_safety_product_quality_impact.level ||
      psRationale !==
        riskParsed.patient_safety_product_quality_impact.rationale);
  const isRegModified =
    !!riskParsed &&
    overrideConfirmed &&
    (regLevel !== riskParsed.regulatory_impact.level ||
      regRationale !== riskParsed.regulatory_impact.rationale ||
      JSON.stringify(regFilings) !==
        JSON.stringify(
          riskParsed.regulatory_impact.filings_or_submissions_affected,
        ));
  const isDiModified =
    !!riskParsed &&
    overrideConfirmed &&
    (diLevel !== riskParsed.data_integrity_risk.level ||
      diRationale !== riskParsed.data_integrity_risk.rationale);
  const isOdModified =
    !!riskParsed &&
    overrideConfirmed &&
    (odLevel !== riskParsed.operational_disruption_risk.level ||
      odRationale !== riskParsed.operational_disruption_risk.rationale);
  const isRankingModified =
    !!riskParsed &&
    overrideConfirmed &&
    rankingJustification !== riskParsed.risk_ranking_justification;

  return {
    navigate,
    chatOpen,
    setChatOpen,

    result,
    classificationParsed,
    impactParsed,
    riskParsed,

    psLevel,
    psRationale,
    regLevel,
    regFilings,
    setRegFilings,
    regRationale,
    diLevel,
    diRationale,
    odLevel,
    odRationale,
    rankingJustification,
    setRankingJustification,

    updatePsLevel,
    updatePsRationale,
    updateRegLevel,
    updateRegRationale,
    updateDiLevel,
    updateDiRationale,
    updateOdLevel,
    updateOdRationale,

    psChangedWithoutRationale,
    regChangedWithoutRationale,
    diChangedWithoutRationale,
    odChangedWithoutRationale,

    isPsModified,
    isRegModified,
    isDiModified,
    isOdModified,
    isRankingModified,

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
    confidenceScore,

    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}