import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../../utils/api";
import {
  ModifiedBadge,
  OverrideBar,
  StepProgressBar,
} from "../../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import {
  aiField,
  markModified,
  type ChangeControlSummaryProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type {
  ChangeControlSummaryApiResponse,
  ChangeControlSummaryParsed,
  ControlChecklistItem,
  FinalRecommendation,
  RiskLevel,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { CHANGE_CONTROL_SUMMARY_FIELD_LABELS } from "../../mocks/mockChangeSummary";

//Helpers
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

function getRecommendationBadgeClass(rec: string): string {
  switch (rec) {
    case "Approve":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "Reject":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "Conditional":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

//Component
export function ChangecontrolSummary() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const changeImpactParsed =
    result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const implementationParsed =
    result?.stages?.implementationControl?.parsed ?? null;
  const summaryParsed = result?.stages?.changeControlSummary?.parsed ?? null;
  const provenance = result?.provenance;

  //Auto-generate the final AI summary the first time this stage is visited.
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || summaryParsed || isGenerating) return;
    if (!implementationParsed) return;

    let cancelled = false;
    setIsGenerating(true);
    setGenerateError(null);

    apiFetch<ChangeControlSummaryApiResponse>(
      "/api/change-control/final-summary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          changeImpactAssessment: changeImpactParsed,
          riskCriticality: riskParsed,
          validationTesting: result.stages?.validationTesting?.parsed ?? null,
          implementationControl: implementationParsed,
        }),
      },
    )
      .then((res) => {
        if (cancelled) return;
        mergePipelineResult({
          stages: {
            ...result.stages,
            changeControlSummary: res.stages.changeControlSummary,
          },
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setGenerateError(
          err instanceof Error
            ? err.message
            : "Something went wrong generating the final change control summary. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, implementationParsed, summaryParsed]);

  //Editable form state, seeded from the AI-generated values
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    summaryParsed?.risk_classification.level ?? "Low",
  );
  const [riskJustification, setRiskJustification] = useState(
    summaryParsed?.risk_classification.justification ?? "",
  );
  const [impactSummary, setImpactSummary] = useState(
    summaryParsed?.impact_assessment_summary ?? "",
  );
  const [validationSummary, setValidationSummary] = useState(
    summaryParsed?.validation_strategy_summary ?? "",
  );
  const [checklist, setChecklist] = useState<ControlChecklistItem[]>(
    summaryParsed?.required_controls_checklist ?? [],
  );
  const [finalRecommendation, setFinalRecommendation] =
    useState<FinalRecommendation>(
      summaryParsed?.final_recommendation ?? "Conditional",
    );
  const [residualRisk, setResidualRisk] = useState(
    summaryParsed?.residual_risk_statement ?? "",
  );

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [summaryAccepted, setSummaryAccepted] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // Save flow
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavedByDialog, setShowSavedByDialog] = useState(false);
  const [savedByName, setSavedByName] = useState("");
  const [savedByError, setSavedByError] = useState("");

  // Re-hydrate local editable state whenever a new AI result lands in store
  useEffect(() => {
    if (!summaryParsed) return;
    setRiskLevel(summaryParsed.risk_classification.level);
    setRiskJustification(summaryParsed.risk_classification.justification);
    setImpactSummary(summaryParsed.impact_assessment_summary);
    setValidationSummary(summaryParsed.validation_strategy_summary);
    setChecklist(summaryParsed.required_controls_checklist);
    setFinalRecommendation(summaryParsed.final_recommendation);
    setResidualRisk(summaryParsed.residual_risk_statement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryParsed]);

  //Guard: no submission yet
  if (
    !result ||
    !classificationParsed ||
    !changeImpactParsed ||
    !riskParsed ||
    !implementationParsed
  ) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No summary data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and complete the Implementation &amp; Control
              Actions step first.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/change-control/implementation")}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Guard: still generating / failed to generate and nothing to show yet
  if (!summaryParsed) {
    return (
      <div className="relative h-full w-full">
        <div className="min-h-screen p-6">
          <StepProgressBar
            classification={classificationParsed.classification}
            implementationAccepted
          />
          <Card>
            <CardContent className="py-12 text-center">
              {isGenerating ? (
                <>
                  <Loader2 className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-spin" />
                  <p className="text-foreground font-medium">
                    Generating final change control summary…
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will only take a moment.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-foreground font-medium">
                    No final summary found.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generateError ??
                      "Please go back and complete the Implementation & Control Actions step first."}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/change-control/implementation")}
                  >
                    Go Back
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const decisionMade = summaryAccepted || isOverrideEditing || overrideConfirmed;

  const updateChecklistItem = (index: number, patch: Partial<ControlChecklistItem>) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  //Provenance + approved result builders
  const buildProvenance = (confirmed: boolean): ChangeControlSummaryProvenance => ({
    impact_assessment_summary:
      confirmed && impactSummary !== summaryParsed.impact_assessment_summary
        ? markModified(aiField(summaryParsed.impact_assessment_summary), impactSummary)
        : aiField(summaryParsed.impact_assessment_summary),
    risk_classification: {
      level:
        confirmed && riskLevel !== summaryParsed.risk_classification.level
          ? markModified(aiField(summaryParsed.risk_classification.level), riskLevel)
          : aiField(summaryParsed.risk_classification.level),
      justification:
        confirmed &&
        riskJustification !== summaryParsed.risk_classification.justification
          ? markModified(
              aiField(summaryParsed.risk_classification.justification),
              riskJustification,
            )
          : aiField(summaryParsed.risk_classification.justification),
    },
    validation_strategy_summary:
      confirmed && validationSummary !== summaryParsed.validation_strategy_summary
        ? markModified(
            aiField(summaryParsed.validation_strategy_summary),
            validationSummary,
          )
        : aiField(summaryParsed.validation_strategy_summary),
    required_controls_checklist:
      confirmed &&
      JSON.stringify(checklist) !==
        JSON.stringify(summaryParsed.required_controls_checklist)
        ? markModified(
            aiField(summaryParsed.required_controls_checklist),
            checklist,
          )
        : aiField(summaryParsed.required_controls_checklist),
    final_recommendation:
      confirmed && finalRecommendation !== summaryParsed.final_recommendation
        ? markModified(
            aiField(summaryParsed.final_recommendation),
            finalRecommendation,
          )
        : aiField(summaryParsed.final_recommendation),
    residual_risk_statement:
      confirmed && residualRisk !== summaryParsed.residual_risk_statement
        ? markModified(
            aiField(summaryParsed.residual_risk_statement),
            residualRisk,
          )
        : aiField(summaryParsed.residual_risk_statement),
    confidence_score: summaryParsed.confidence_score,
  });

  const buildApprovedSummary = (): ChangeControlSummaryParsed => ({
    ...summaryParsed,
    impact_assessment_summary: impactSummary,
    risk_classification: { level: riskLevel, justification: riskJustification },
    validation_strategy_summary: validationSummary,
    required_controls_checklist: checklist,
    final_recommendation: finalRecommendation,
    residual_risk_statement: residualRisk,
  });

  const commitSummary = () => {
    const summaryProvenance = buildProvenance(overrideConfirmed);
    mergePipelineResult({
      stages: {
        ...result.stages,
        changeControlSummary: {
          ...result.stages.changeControlSummary!,
          parsed: buildApprovedSummary(),
        },
      },
      provenance: { ...result.provenance, changeControlSummary: summaryProvenance },
    });
  };

  //Handlers
  const handleAccept = () => {
    setSummaryAccepted(true);
    commitSummary();
  };
  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    setRiskLevel(summaryParsed.risk_classification.level);
    setRiskJustification(summaryParsed.risk_classification.justification);
    setImpactSummary(summaryParsed.impact_assessment_summary);
    setValidationSummary(summaryParsed.validation_strategy_summary);
    setChecklist(summaryParsed.required_controls_checklist);
    setFinalRecommendation(summaryParsed.final_recommendation);
    setResidualRisk(summaryParsed.residual_risk_statement);
    setIsOverrideEditing(false);
  };

  const handleOverrideConfirm = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
    commitSummary();
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  //Save handlers (finalize + persist the whole change control record)
  const handleSaveClick = () => {
    setSavedByName("");
    setSavedByError("");
    setShowSavedByDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!savedByName.trim()) {
      setSavedByError("Please enter your name before saving.");
      return;
    }
    setSavedByError("");
    setShowSavedByDialog(false);
    setSaveError(null);
    setIsSaving(true);

    try {
      await apiFetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          classification: classificationParsed,
          change_impact_assessment: changeImpactParsed,
          risk_criticality: riskParsed,
          validation_testing: result.stages?.validationTesting?.parsed ?? null,
          implementation_control: implementationParsed,
          change_control_summary: buildApprovedSummary(),
          status: result.status,
          halted_at: result.haltedAt,
          saved_by: savedByName.trim(),
          provenance: provenance ?? null,
        }),
      });

      setIsSaved(true);
      setTimeout(() => {
        clearWorkflow();
        navigate("/records");
      }, 800);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving the record. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceScore = summaryParsed.confidence_score;
  const isImpactModified =
    overrideConfirmed && impactSummary !== summaryParsed.impact_assessment_summary;
  const isRiskModified =
    overrideConfirmed &&
    (riskLevel !== summaryParsed.risk_classification.level ||
      riskJustification !== summaryParsed.risk_classification.justification);
  const isValidationModified =
    overrideConfirmed &&
    validationSummary !== summaryParsed.validation_strategy_summary;
  const isChecklistModified =
    overrideConfirmed &&
    JSON.stringify(checklist) !==
      JSON.stringify(summaryParsed.required_controls_checklist);
  const isRecommendationModified =
    overrideConfirmed && finalRecommendation !== summaryParsed.final_recommendation;
  const isResidualModified =
    overrideConfirmed && residualRisk !== summaryParsed.residual_risk_statement;

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={classificationParsed.classification}
          implementationAccepted
          changeControlStepAccepted={summaryAccepted || overrideConfirmed}
        />

        <div className="space-y-6">
          {/* Confidence */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Overall AI Confidence Score
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                ({riskParsed && (riskParsed.patient_safety_product_quality_impact.level === "High" || riskParsed.regulatory_impact.level === "High" || riskParsed.data_integrity_risk.level === "High" || riskParsed.operational_disruption_risk.level === "High") ? "High" : riskParsed && (riskParsed.patient_safety_product_quality_impact.level === "Moderate" || riskParsed.regulatory_impact.level === "Moderate" || riskParsed.data_integrity_risk.level === "Moderate" || riskParsed.operational_disruption_risk.level === "Moderate") ? "Moderate" : "Low"} Risk System Rationale)
              </p>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={confidenceScore} />
            </CardContent>
          </Card>

          {/* Impact Assessment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.impact_assessment_summary}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isImpactModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Textarea
                  rows={4}
                  value={impactSummary}
                  onChange={(e) => setImpactSummary(e.target.value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {impactSummary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Risk Classification + Justification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.risk_classification}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isRiskModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOverrideEditing ? (
                <>
                  <Select
                    value={riskLevel}
                    onValueChange={(v) => setRiskLevel(v as RiskLevel)}
                  >
                    <SelectTrigger className="w-full md:w-1/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={3}
                    value={riskJustification}
                    onChange={(e) => setRiskJustification(e.target.value)}
                    placeholder="Explain the risk classification..."
                  />
                </>
              ) : (
                <>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(riskLevel)}`}
                  >
                    {riskLevel} Risk
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {riskJustification}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Validation Strategy Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.validation_strategy_summary}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isValidationModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Textarea
                  rows={4}
                  value={validationSummary}
                  onChange={(e) => setValidationSummary(e.target.value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {validationSummary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Required Controls Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.required_controls_checklist}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isChecklistModified && <ModifiedBadge />}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Explainability + Data Integrity
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  {isOverrideEditing ? (
                    <input
                      type="checkbox"
                      checked={item.satisfied}
                      onChange={(e) =>
                        updateChecklistItem(index, { satisfied: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  ) : item.satisfied ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    {isOverrideEditing ? (
                      <Textarea
                        rows={2}
                        value={item.notes}
                        onChange={(e) =>
                          updateChecklistItem(index, { notes: e.target.value })
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Final Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.final_recommendation}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isRecommendationModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Select
                  value={finalRecommendation}
                  onValueChange={(v) =>
                    setFinalRecommendation(v as FinalRecommendation)
                  }
                >
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approve">Approve</SelectItem>
                    <SelectItem value="Conditional">Conditional</SelectItem>
                    <SelectItem value="Reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationBadgeClass(finalRecommendation)}`}
                >
                  {finalRecommendation}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Residual Risk Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_CONTROL_SUMMARY_FIELD_LABELS.residual_risk_statement}
                <Sparkles className="h-5 w-5 text-blue-600" />
                {!isOverrideEditing && isResidualModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Textarea
                  rows={3}
                  value={residualRisk}
                  onChange={(e) => setResidualRisk(e.target.value)}
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {residualRisk}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Save */}
          <div className="pt-1 pb-1">
            {saveError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Save failed</p>
                  <p className="mt-1">{saveError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pr-10 ">
              <Button
                onClick={() => setShowSavedByDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Saved By Dialog */}
        <Dialog open={showSavedByDialog} onOpenChange={setShowSavedByDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Save Record
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Please enter your name to record who is saving this change
                control case.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="saved-by">Saved By</Label>
                <Input
                  id="saved-by"
                  placeholder="Enter your full name"
                  value={savedByName}
                  onChange={(e) => {
                    setSavedByName(e.target.value);
                    if (savedByError) setSavedByError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSave();
                  }}
                  autoFocus
                />
                {savedByError && (
                  <p className="text-xs text-red-600">{savedByError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSavedByDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirmSave}
              >
                Confirm &amp; Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}