import { useState } from "react";
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
  type ChangeImpactAssessmentProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type {
  ChangeImpactAssessmentParsed,
  GxpClassification,
  RiskLevel,
  RCAApiResponse,
  RiskCriticalityApiResponse,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";

//Helpers
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Styling aligned with the reference image badges
function getGxpBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("no impact"))
    return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  if (v.includes("indirect"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  if (v.includes("direct"))
    return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  return "bg-muted text-muted-foreground border border-border";
}

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

function getValidationImpactBadgeClass(affected: boolean): string {
  return affected
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

//Component
export function ChangeImpactAssessment() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const changeImpactParsed =
    result?.stages?.changeImpactAssessment?.parsed ?? null;

  //Editable form state, seeded from the AI-generated values
  const [impactedSystems, setImpactedSystems] = useState<string[]>(
    changeImpactParsed?.impacted_systems ?? [],
  );
  const [downstreamDependencies, setDownstreamDependencies] = useState<
    string[]
  >(changeImpactParsed?.downstream_dependencies ?? []);
  const [gxpValue, setGxpValue] = useState<GxpClassification>(
    changeImpactParsed?.gxp_classification.value ?? "No Impact",
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

  //"Changed the value but not the rationale" tracking
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

  //Guard
  if (!changeImpactParsed || !classificationParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No change impact assessment data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and submit a quality event first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Field update helpers
  const updateGxpValue = (value: string) => {
    setGxpValue(value as GxpClassification);
    setGxpChangedWithoutRationale(
      value !== changeImpactParsed.gxp_classification.value,
    );
  };

  const updateGxpRationale = (value: string) => {
    setGxpRationale(value);
    if (value !== changeImpactParsed.gxp_classification.rationale) {
      setGxpChangedWithoutRationale(false);
    }
  };

  const updateValidatedStateAffected = (value: string) => {
    const next = value === "true";
    setValidatedStateAffected(next);
    setValidationChangedWithoutRationale(
      next !== changeImpactParsed.data_validation_impact.validated_state_affected,
    );
  };

  const updateDataValidationRationale = (value: string) => {
    setDataValidationRationale(value);
    if (value !== changeImpactParsed.data_validation_impact.rationale) {
      setValidationChangedWithoutRationale(false);
    }
  };

  const updateRiskLevel = (value: string) => {
    setRiskLevel(value as RiskLevel);
    setRiskChangedWithoutRationale(
      value !== changeImpactParsed.risk_scoring.level,
    );
  };

  const updateRiskRationale = (value: string) => {
    setRiskRationale(value);
    if (value !== changeImpactParsed.risk_scoring.rationale) {
      setRiskChangedWithoutRationale(false);
    }
  };

  const buildApprovedChangeImpactAssessment =
    (): ChangeImpactAssessmentParsed => ({
      ...changeImpactParsed,
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
    const original = changeImpactParsed;

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
    const approvedChangeImpactAssessment = buildApprovedChangeImpactAssessment();
    try {
      const riskResult: RiskCriticalityApiResponse = await apiFetch(
        "/api/change-control/risk-criticality",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            classification: classificationParsed,
            changeImpactAssessment: approvedChangeImpactAssessment,
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
    const changeImpactProvenance = buildChangeImpactProvenance(overrideConfirmed);
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

  const confidenceScore = changeImpactParsed.confidence_score;

  const isGxpModified =
    overrideConfirmed &&
    (gxpValue !== changeImpactParsed.gxp_classification.value ||
      gxpRationale !== changeImpactParsed.gxp_classification.rationale);
  const isValidationModified =
    overrideConfirmed &&
    (validatedStateAffected !==
      changeImpactParsed.data_validation_impact.validated_state_affected ||
      dataValidationRationale !==
        changeImpactParsed.data_validation_impact.rationale);
  const isRiskModified =
    overrideConfirmed &&
    (riskLevel !== changeImpactParsed.risk_scoring.level ||
      riskRationale !== changeImpactParsed.risk_scoring.rationale);
  const isSystemsModified =
    overrideConfirmed &&
    JSON.stringify(impactedSystems) !==
      JSON.stringify(changeImpactParsed.impacted_systems);
  const isDependenciesModified =
    overrideConfirmed &&
    JSON.stringify(downstreamDependencies) !==
      JSON.stringify(changeImpactParsed.downstream_dependencies);

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
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Overall AI Confidence Score
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Based on Change Control classification
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
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

          {/* Grid Container for Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. GxP Classification */}
            <Card className="shadow-sm border-gray-200 flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {CHANGE_IMPACT_FIELD_LABELS.gxp_classification}
                  </h3>
                  {!isOverrideEditing && isGxpModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select value={gxpValue} onValueChange={updateGxpValue}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct Impact">Direct Impact</SelectItem>
                        <SelectItem value="Indirect Impact">Indirect Impact</SelectItem>
                        <SelectItem value="No Impact">No Impact</SelectItem>
                      </SelectContent>
                    </Select>
                    {gxpChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale below
                      </p>
                    )}
                    <Textarea
                      rows={4}
                      value={gxpRationale}
                      onChange={(e) => updateGxpRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${gxpChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getGxpBadgeClass(gxpValue)}`}>
                        {gxpValue}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
                      {gxpRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Data & Validation Impact */}
            <Card className="shadow-sm border-gray-200 flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {CHANGE_IMPACT_FIELD_LABELS.data_validation_impact}
                  </h3>
                  {!isOverrideEditing && isValidationModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3">
                    <Select
                      value={String(validatedStateAffected)}
                      onValueChange={updateValidatedStateAffected}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Validated State Affected</SelectItem>
                        <SelectItem value="false">Validated State Not Affected</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale below
                      </p>
                    )}
                    <Textarea
                      rows={4}
                      value={dataValidationRationale}
                      onChange={(e) => updateDataValidationRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${validationChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getValidationImpactBadgeClass(validatedStateAffected)}`}>
                        {validatedStateAffected ? "Affected" : "None"}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
                      {dataValidationRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Impacted Systems */}
            <Card className="shadow-sm border-gray-200 flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {CHANGE_IMPACT_FIELD_LABELS.impacted_systems}
                  </h3>
                  {!isOverrideEditing && isSystemsModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <Textarea
                    rows={4}
                    value={impactedSystems.join("\n")}
                    onChange={(e) => setImpactedSystems(parseLines(e.target.value))}
                    placeholder="One system / process / study per line..."
                    className="resize-none text-sm"
                  />
                ) : (
                  <div className="flex flex-col gap-2 flex-1 mt-1">
                    {impactedSystems.length > 0 ? (
                      impactedSystems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
                        None
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Downstream Dependencies */}
            <Card className="shadow-sm border-gray-200 flex flex-col h-full">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {CHANGE_IMPACT_FIELD_LABELS.downstream_dependencies}
                  </h3>
                  {!isOverrideEditing && isDependenciesModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <Textarea
                    rows={4}
                    value={downstreamDependencies.join("\n")}
                    onChange={(e) => setDownstreamDependencies(parseLines(e.target.value))}
                    placeholder="One dependency per line..."
                    className="resize-none text-sm"
                  />
                ) : (
                  <div className="flex flex-col gap-2 flex-1 mt-1">
                    {downstreamDependencies.length > 0 ? (
                      downstreamDependencies.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
                        None
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Risk Scoring (Spans full width for emphasis) */}
            <Card className="shadow-sm border-gray-200 flex flex-col h-full md:col-span-2">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 justify-between mb-4">
                  <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
                    {CHANGE_IMPACT_FIELD_LABELS.risk_scoring}
                  </h3>
                  {!isOverrideEditing && isRiskModified && <ModifiedBadge />}
                </div>

                {isOverrideEditing ? (
                  <div className="space-y-3 md:w-1/2">
                    <Select value={riskLevel} onValueChange={updateRiskLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {riskChangedWithoutRationale && (
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Update rationale below
                      </p>
                    )}
                    <Textarea
                      rows={3}
                      value={riskRationale}
                      onChange={(e) => updateRiskRationale(e.target.value)}
                      placeholder="Explain the reason for this change..."
                      className={`resize-none text-sm ${riskChangedWithoutRationale ? "border-orange-400" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div>
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(riskLevel)}`}>
                        {riskLevel}
                      </span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
                      {riskRationale || "No rationale provided."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Decision Area */}
          <DecisionAction
            acceptLabel="Accept & Continue to Risk & Criticality"
            acceptLoadingLabel="Submitting Assessment..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Assessment"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Assessment"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isSubmitting}
            error={submitError}
            errorTitle="Assessment submission failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding submits this assessment and starts the Risk & Criticality evaluation — it only starts now, not before you decide."
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
            <p className="text-sm text-muted-foreground mt-3">
              Please update the rationale for each changed field with the
              reason for the new value before saving.
            </p>
            <DialogFooter>
              <Button
                onClick={() => setShowRationaleWarning(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Back & Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Justification Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Change Impact Assessment"
          subjectLabel="the assessment"
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
          title="Reject Change Impact Assessment"
          description="Please provide a reason for rejecting this assessment. This will be recorded in the audit trail."
          subjectLabel="the change impact assessment"
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