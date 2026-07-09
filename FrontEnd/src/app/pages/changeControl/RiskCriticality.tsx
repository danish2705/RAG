import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../../utils/api";
import {
  DecisionAction,
  ModifiedBadge,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { AlertTriangle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  aiField,
  markModified,
  type RiskCriticalityProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type {
  RiskLevel,
  RiskCriticalityParsed,
  ValidationTestingApiResponse,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { nestedToFlatChangeImpactAssessment } from "../../../utils/changeImpactAdapter";
import { flatToNestedValidationTesting } from "../../../utils/changeControlAdapters";

//Field labels — mirrors CHANGE_IMPACT_FIELD_LABELS convention in mockImpactAssessment.ts
const RISK_FIELD_LABELS = {
  patient_safety_product_quality_impact:
    "Patient Safety / Product Quality Impact",
  regulatory_impact: "Regulatory Impact",
  data_integrity_risk: "Data Integrity Risk",
  operational_disruption_risk: "Operational Disruption Risk",
} as const;

//Helpers
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Styling aligned with the sibling ChangeImpactAssessment.tsx badges
function getRiskLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "low":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function filingsToText(filings: string[]): string {
  return filings.join("\n");
}

//Component
export function RiskCriticality() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;

  //Editable form state, seeded from the AI-generated values
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

  //"Changed the value but not the rationale" tracking
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

  //Guard
  if (!riskParsed || !impactParsed || !classificationParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No risk &amp; criticality evaluation data found.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please go back and complete the Change Impact Assessment first.
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                navigate("/change-control/change-impact-assessment")
              }
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Field update helpers
  const updatePsLevel = (value: string) => {
    setPsLevel(value as RiskLevel);
    setPsChangedWithoutRationale(
      value !== riskParsed.patient_safety_product_quality_impact.level,
    );
  };
  const updatePsRationale = (value: string) => {
    setPsRationale(value);
    if (value !== riskParsed.patient_safety_product_quality_impact.rationale) {
      setPsChangedWithoutRationale(false);
    }
  };

  const updateRegLevel = (value: string) => {
    setRegLevel(value as RiskLevel);
    setRegChangedWithoutRationale(value !== riskParsed.regulatory_impact.level);
  };
  const updateRegRationale = (value: string) => {
    setRegRationale(value);
    if (value !== riskParsed.regulatory_impact.rationale) {
      setRegChangedWithoutRationale(false);
    }
  };

  const updateDiLevel = (value: string) => {
    setDiLevel(value as RiskLevel);
    setDiChangedWithoutRationale(
      value !== riskParsed.data_integrity_risk.level,
    );
  };
  const updateDiRationale = (value: string) => {
    setDiRationale(value);
    if (value !== riskParsed.data_integrity_risk.rationale) {
      setDiChangedWithoutRationale(false);
    }
  };

  const updateOdLevel = (value: string) => {
    setOdLevel(value as RiskLevel);
    setOdChangedWithoutRationale(
      value !== riskParsed.operational_disruption_risk.level,
    );
  };
  const updateOdRationale = (value: string) => {
    setOdRationale(value);
    if (value !== riskParsed.operational_disruption_risk.rationale) {
      setOdChangedWithoutRationale(false);
    }
  };

  //Approved risk criticality — already 1:1 with backend's RiskCriticalitySchema
  //(unlike Stage 1, no flat/nested adapter is needed for this stage).
  const buildApprovedRiskCriticality = (): RiskCriticalityParsed => ({
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
    operational_disruption_risk: { level: odLevel, rationale: odRationale },
    risk_ranking_justification: rankingJustification,
  });

  const buildRiskProvenance = (
    confirmed: boolean,
  ): RiskCriticalityProvenance => {
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
    setSubmitError(null);
    setIsSubmitting(true);
    const approvedRiskCriticality = buildApprovedRiskCriticality();
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
    const existingValidationTesting = result!.stages?.validationTesting;
    if (!overrideConfirmed && existingValidationTesting?.parsed) {
      navigateToValidationTesting(
        existingValidationTesting,
        riskProvenance,
        buildApprovedRiskCriticality(),
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

  const confidenceScore = riskParsed.confidence_score;

  const isPsModified =
    overrideConfirmed &&
    (psLevel !== riskParsed.patient_safety_product_quality_impact.level ||
      psRationale !==
        riskParsed.patient_safety_product_quality_impact.rationale);
  const isRegModified =
    overrideConfirmed &&
    (regLevel !== riskParsed.regulatory_impact.level ||
      regRationale !== riskParsed.regulatory_impact.rationale ||
      JSON.stringify(regFilings) !==
        JSON.stringify(
          riskParsed.regulatory_impact.filings_or_submissions_affected,
        ));
  const isDiModified =
    overrideConfirmed &&
    (diLevel !== riskParsed.data_integrity_risk.level ||
      diRationale !== riskParsed.data_integrity_risk.rationale);
  const isOdModified =
    overrideConfirmed &&
    (odLevel !== riskParsed.operational_disruption_risk.level ||
      odRationale !== riskParsed.operational_disruption_risk.rationale);
  const isRankingModified =
    overrideConfirmed &&
    rankingJustification !== riskParsed.risk_ranking_justification;

  //Render
  return (
    <div className="relative h-full w-full bg-gray-50/50 dark:bg-background">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
        />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overriden"
        />

        <div className="space-y-6 mt-6">
          {/* Top Banner: Confidence Score */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Overall AI Confidence Score
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Based on Change Impact Assessment (risk scoring:{" "}
                {impactParsed.risk_scoring.level})
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      confidenceScore >= 80
                        ? "bg-green-500"
                        : confidenceScore >= 60
                          ? "bg-yellow-400"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {confidenceScore}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Grid Container for the 4 risk category fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Patient Safety / Product Quality Impact */}
            <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {RISK_FIELD_LABELS.patient_safety_product_quality_impact}
                  </h3>
                  {!isOverrideEditing && isPsModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select value={psLevel} onValueChange={updatePsLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {psChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale
                        below
                      </p>
                    )}
                    <Textarea
                      rows={4}
                      value={psRationale}
                      onChange={(e) => updatePsRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${psChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(psLevel)}`}
                      >
                        {psLevel}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                      {psRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Regulatory Impact */}
            <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {RISK_FIELD_LABELS.regulatory_impact}
                  </h3>
                  {!isOverrideEditing && isRegModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select value={regLevel} onValueChange={updateRegLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      rows={2}
                      value={filingsToText(regFilings)}
                      onChange={(e) =>
                        setRegFilings(parseLines(e.target.value))
                      }
                      placeholder="One filing/submission per line..."
                      className="resize-none text-sm"
                    />
                    {regChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale
                        below
                      </p>
                    )}
                    <Textarea
                      rows={3}
                      value={regRationale}
                      onChange={(e) => updateRegRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${regChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(regLevel)}`}
                      >
                        {regLevel} regulatory risk
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                        Filings / Submissions Affected
                      </p>
                      {regFilings.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {regFilings.map((f, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-[13px] text-gray-500 dark:text-gray-400"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-600 shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 italic">
                          No specific filings or submissions identified.
                        </p>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                      {regRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Data Integrity Risk */}
            <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {RISK_FIELD_LABELS.data_integrity_risk}
                  </h3>
                  {!isOverrideEditing && isDiModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select value={diLevel} onValueChange={updateDiLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {diChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale
                        below
                      </p>
                    )}
                    <Textarea
                      rows={4}
                      value={diRationale}
                      onChange={(e) => updateDiRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${diChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(diLevel)}`}
                      >
                        {diLevel}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                      {diRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Operational Disruption Risk */}
            <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {RISK_FIELD_LABELS.operational_disruption_risk}
                  </h3>
                  {!isOverrideEditing && isOdModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select value={odLevel} onValueChange={updateOdLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {odChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale
                        below
                      </p>
                    )}
                    <Textarea
                      rows={4}
                      value={odRationale}
                      onChange={(e) => updateOdRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${odChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(odLevel)}`}
                      >
                        {odLevel}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                      {odRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Risk Ranking & Justification (spans full width) */}
            <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full md:col-span-2">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    Risk Ranking &amp; Justification
                  </h3>
                  {!isOverrideEditing && isRankingModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <Textarea
                    rows={4}
                    value={rankingJustification}
                    onChange={(e) => setRankingJustification(e.target.value)}
                    placeholder="Explain the overall risk ranking for this change..."
                    className="resize-none text-sm md:w-2/3"
                  />
                ) : (
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {rankingJustification || "No justification provided."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Decision Area */}
          <DecisionAction
            acceptLabel="Accept & Continue to Validation & Testing Strategy"
            acceptLoadingLabel="Submitting Evaluation..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Evaluation"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Evaluation"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isSubmitting}
            error={submitError}
            errorTitle="Evaluation submission failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding submits this evaluation and starts the Validation & Testing strategy — it only starts now, not before you decide."
          />
        </div>

        {/* Warning Dialog */}
        <Dialog
          open={showRationaleWarning}
          onOpenChange={setShowRationaleWarning}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Rationale Update Required
              </DialogTitle>
              <DialogDescription>
                You changed the value for the following{" "}
                {warningFields.length === 1 ? "field" : "fields"} but have not
                updated the rationale to explain the change:
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 space-y-1">
              {warningFields.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Please update the rationale for each changed field with the reason
              for the new value before saving.
            </p>
            <DialogFooter>
              <Button
                onClick={() => setShowRationaleWarning(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Back &amp; Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Justification Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Risk & Criticality Evaluation"
          subjectLabel="the evaluation"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isSubmitting}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Risk & Criticality Evaluation"
          description="Please provide a reason for rejecting this evaluation. This will be recorded in the audit trail."
          subjectLabel="the risk & criticality evaluation"
          value={rejectJustification}
          onChange={setRejectJustification}
          onCancel={() => setShowRejectDialog(false)}
          onConfirm={handleReject}
        />

        <div className="fixed top-16 right-0 bottom-0 z-40">
          <AIAssistant
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
          />
        </div>
      </div>
    </div>
  );
}
