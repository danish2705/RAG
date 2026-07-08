import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import {
  DecisionAction,
  ModifiedStatus,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Boxes,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  aiField,
  markModified,
  type ChangeImpactAssessmentProvenance,
} from "../types/dataProvenance";
import { AIAssistant } from "../components/chat/ai-assistant";
import type {
  RiskLevel,
  RiskCriticalityApiResponse,
} from "../types/pipeline";
import { useWorkflowStore } from "../store/workflowStore";
import { buildSampleChangeControlResult } from "../mocks/mockChangeControlSample";

//Helpers
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

function getRiskBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "low":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

function getGxpBadgeClass(classification: string): string {
  return classification === "Direct"
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
}

function getValidatedStateBadgeClass(affected: boolean): string {
  return affected
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
}

//Component
export function ChangeImpactAssessment() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);
  const setPipelineResult = useWorkflowStore((s) => s.setPipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);

  const [impactedSystems, setImpactedSystems] = useState(
    impactParsed?.impacted_systems_processes_studies ?? [],
  );
  const [gxpClassification, setGxpClassification] = useState(
    impactParsed?.gxp_classification ?? "Indirect",
  );
  const [validatedStateAffected, setValidatedStateAffected] = useState(
    impactParsed?.validated_state_affected ?? false,
  );
  const [dataValidationRationale, setDataValidationRationale] = useState(
    impactParsed?.data_validation_impact_rationale ?? "",
  );
  const [downstreamDependencies, setDownstreamDependencies] = useState(
    impactParsed?.downstream_dependencies ?? [],
  );
  const [riskScoring, setRiskScoring] = useState<RiskLevel>(
    impactParsed?.risk_scoring ?? "Low",
  );
  const [rationale, setRationale] = useState(impactParsed?.rationale ?? []);

  // Originals — used for diffing/"Modified" badges and to restore on Cancel
  // Override. Kept in state (not a plain constant) and re-synced by the
  // effect below whenever a *new* assessment lands in the store, so this
  // page doesn't freeze blank if it was already mounted (e.g. showing the
  // "no data" fallback) before the data arrived.
  const [original, setOriginal] = useState({
    impactedSystems: impactParsed?.impacted_systems_processes_studies ?? [],
    gxpClassification: impactParsed?.gxp_classification ?? "Indirect",
    validatedStateAffected: impactParsed?.validated_state_affected ?? false,
    dataValidationRationale:
      impactParsed?.data_validation_impact_rationale ?? "",
    downstreamDependencies: impactParsed?.downstream_dependencies ?? [],
    riskScoring: impactParsed?.risk_scoring ?? ("Low" as RiskLevel),
    rationale: impactParsed?.rationale ?? [],
  });

  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isRunningRisk, setIsRunningRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  // Re-hydrate local editable state whenever a new change impact assessment
  // lands in the store.
  useEffect(() => {
    if (!impactParsed) return;
    setImpactedSystems(impactParsed.impacted_systems_processes_studies);
    setGxpClassification(impactParsed.gxp_classification);
    setValidatedStateAffected(impactParsed.validated_state_affected);
    setDataValidationRationale(impactParsed.data_validation_impact_rationale);
    setDownstreamDependencies(impactParsed.downstream_dependencies);
    setRiskScoring(impactParsed.risk_scoring);
    setRationale(impactParsed.rationale);
    setOriginal({
      impactedSystems: impactParsed.impacted_systems_processes_studies,
      gxpClassification: impactParsed.gxp_classification,
      validatedStateAffected: impactParsed.validated_state_affected,
      dataValidationRationale: impactParsed.data_validation_impact_rationale,
      downstreamDependencies: impactParsed.downstream_dependencies,
      riskScoring: impactParsed.risk_scoring,
      rationale: impactParsed.rationale,
    });
    setOverrideConfirmed(false);
    setIsOverrideEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactParsed]);

  const impactedSystemsText = useMemo(
    () => linesToText(impactedSystems),
    [impactedSystems],
  );
  const downstreamDependenciesText = useMemo(
    () => linesToText(downstreamDependencies),
    [downstreamDependencies],
  );
  const rationaleText = useMemo(() => linesToText(rationale), [rationale]);

  //Guard
  if (!impactParsed || !classificationParsed) {
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
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => setPipelineResult(buildSampleChangeControlResult())}
              >
                Load Sample Data (Preview)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Provenance builder
  const buildImpactProvenance = (
    confirmed: boolean,
  ): ChangeImpactAssessmentProvenance => {
    const build = <T,>(current: T, orig: T) =>
      confirmed && JSON.stringify(current) !== JSON.stringify(orig)
        ? markModified(aiField(orig), current)
        : aiField(orig);

    return {
      impacted_systems_processes_studies: build(
        impactedSystems,
        original.impactedSystems,
      ),
      gxp_classification: build(gxpClassification, original.gxpClassification),
      validated_state_affected: build(
        validatedStateAffected,
        original.validatedStateAffected,
      ),
      data_validation_impact_rationale: build(
        dataValidationRationale,
        original.dataValidationRationale,
      ),
      downstream_dependencies: build(
        downstreamDependencies,
        original.downstreamDependencies,
      ),
      risk_scoring: build(riskScoring, original.riskScoring),
      rationale: build(rationale, original.rationale),
      confidence_score: impactParsed.confidence_score,
    };
  };

  //Approved change impact assessment builder — reflects any override edits,
  //in the shape the backend's ChangeImpactAssessmentSchema expects.
  const buildApprovedImpactAssessment = () => ({
    ...impactParsed,
    impacted_systems_processes_studies: impactedSystems,
    gxp_classification: gxpClassification,
    validated_state_affected: validatedStateAffected,
    data_validation_impact_rationale: dataValidationRationale,
    downstream_dependencies: downstreamDependencies,
    risk_scoring: riskScoring,
    rationale,
  });

  //Navigation helpers
  const navigateToRiskCriticality = (
    riskStage: NonNullable<RiskCriticalityApiResponse["stages"]["riskCriticality"]>,
    impactProvenance: ChangeImpactAssessmentProvenance,
    approvedImpactAssessment: ReturnType<typeof buildApprovedImpactAssessment>,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        changeImpactAssessment: {
          ...result!.stages.changeImpactAssessment!,
          parsed: approvedImpactAssessment,
        },
        riskCriticality: riskStage,
      },
      provenance: {
        ...result!.provenance,
        changeImpactAssessment: impactProvenance,
      },
    });
    navigate("/change-control/risk-criticality");
  };

  const runRiskCriticality = useCallback(
    async (impactProvenance: ChangeImpactAssessmentProvenance) => {
      setRiskError(null);
      setIsRunningRisk(true);
      const approvedImpactAssessment = buildApprovedImpactAssessment();
      try {
        const riskResult: RiskCriticalityApiResponse = await apiFetch(
          "/api/change-control/risk-criticality",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: result!.query,
              changeImpactAssessment: approvedImpactAssessment,
            }),
          },
        );
        navigateToRiskCriticality(
          riskResult.stages.riskCriticality!,
          impactProvenance,
          approvedImpactAssessment,
        );
      } catch (err) {
        setRiskError(
          err instanceof Error
            ? err.message
            : "Something went wrong running the risk & criticality evaluation. Please try again.",
        );
      } finally {
        setIsRunningRisk(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      result,
      impactedSystems,
      gxpClassification,
      validatedStateAffected,
      dataValidationRationale,
      downstreamDependencies,
      riskScoring,
      rationale,
    ],
  );

  const handleAccept = () => {
    const impactProvenance = buildImpactProvenance(overrideConfirmed);
    const existingRisk = result!.stages?.riskCriticality;
    if (!overrideConfirmed && existingRisk?.parsed) {
      navigateToRiskCriticality(
        existingRisk,
        impactProvenance,
        buildApprovedImpactAssessment(),
      );
      return;
    }
    void runRiskCriticality(impactProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    setIsOverrideEditing(false);
    setImpactedSystems(original.impactedSystems);
    setGxpClassification(original.gxpClassification);
    setValidatedStateAffected(original.validatedStateAffected);
    setDataValidationRationale(original.dataValidationRationale);
    setDownstreamDependencies(original.downstreamDependencies);
    setRiskScoring(original.riskScoring);
    setRationale(original.rationale);
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

  const confidenceScore = impactParsed.confidence_score;

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Change Impact Assessment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Systems, GxP classification, validated-state and downstream
            impact of this change, and the resulting risk score.
          </p>
        </div>

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overriden"
        />

        <div className="space-y-6">
          {/* Confidence */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Overall AI Confidence Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Based on {classificationParsed.classification} classification
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {confidenceScore}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${confidenceScore >= 80 ? "bg-green-500" : confidenceScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impacted systems / processes / studies */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-blue-600" />
                    Impacted Systems / Processes / Studies
                  </span>
                  <ModifiedStatus
                    enabled={overrideConfirmed && !isOverrideEditing}
                    original={original.impactedSystems}
                    current={impactedSystems}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOverrideEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      rows={5}
                      value={impactedSystemsText}
                      onChange={(e) =>
                        setImpactedSystems(parseLines(e.target.value))
                      }
                      placeholder="One system, process, or study per line..."
                    />
                    <p className="text-xs text-muted-foreground">
                      One per line
                    </p>
                  </div>
                ) : impactedSystems.length > 0 ? (
                  <ul className="space-y-2">
                    {impactedSystems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    None identified
                  </p>
                )}
              </CardContent>
            </Card>

            {/* GxP classification */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    GxP Classification
                  </span>
                  <ModifiedStatus
                    enabled={overrideConfirmed && !isOverrideEditing}
                    original={original.gxpClassification}
                    current={gxpClassification}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isOverrideEditing ? (
                  <Select
                    value={gxpClassification}
                    onValueChange={(v) =>
                      setGxpClassification(v as "Direct" | "Indirect")
                    }
                  >
                    <SelectTrigger
                      className={getGxpBadgeClass(gxpClassification)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Direct">Direct Impact</SelectItem>
                      <SelectItem value="Indirect">Indirect Impact</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getGxpBadgeClass(gxpClassification)}>
                    {gxpClassification} Impact
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  Whether this change has a direct or indirect effect on a
                  GxP-regulated system or process.
                </p>
              </CardContent>
            </Card>

            {/* Data & validation impact */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Data &amp; Validation Impact
                  </span>
                  <ModifiedStatus
                    enabled={overrideConfirmed && !isOverrideEditing}
                    original={{
                      validatedStateAffected: original.validatedStateAffected,
                      dataValidationRationale: original.dataValidationRationale,
                    }}
                    current={{ validatedStateAffected, dataValidationRationale }}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Validated State Affected?
                  </label>
                  {isOverrideEditing ? (
                    <Select
                      value={validatedStateAffected ? "yes" : "no"}
                      onValueChange={(v) =>
                        setValidatedStateAffected(v === "yes")
                      }
                    >
                      <SelectTrigger
                        className={getValidatedStateBadgeClass(
                          validatedStateAffected,
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={getValidatedStateBadgeClass(
                        validatedStateAffected,
                      )}
                    >
                      {validatedStateAffected ? "Yes" : "No"}
                    </Badge>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rationale
                  </label>
                  {isOverrideEditing ? (
                    <Textarea
                      rows={4}
                      value={dataValidationRationale}
                      onChange={(e) =>
                        setDataValidationRationale(e.target.value)
                      }
                      placeholder="Explain the data/validation impact..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {dataValidationRationale}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Downstream dependencies */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-blue-600" />
                    Downstream Dependencies
                  </span>
                  <ModifiedStatus
                    enabled={overrideConfirmed && !isOverrideEditing}
                    original={original.downstreamDependencies}
                    current={downstreamDependencies}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOverrideEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      rows={5}
                      value={downstreamDependenciesText}
                      onChange={(e) =>
                        setDownstreamDependencies(parseLines(e.target.value))
                      }
                      placeholder="One interface, report, or integration per line..."
                    />
                    <p className="text-xs text-muted-foreground">
                      One per line — interfaces, reports, integrations
                    </p>
                  </div>
                ) : downstreamDependencies.length > 0 ? (
                  <ul className="space-y-2">
                    {downstreamDependencies.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    None identified
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk scoring */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  Risk Scoring
                </span>
                <ModifiedStatus
                  enabled={overrideConfirmed && !isOverrideEditing}
                  original={original.riskScoring}
                  current={riskScoring}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Select
                  value={riskScoring}
                  onValueChange={(v) => setRiskScoring(v as RiskLevel)}
                >
                  <SelectTrigger className={`w-48 ${getRiskBadgeClass(riskScoring)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">🔴 High</SelectItem>
                    <SelectItem value="Moderate">🟡 Moderate</SelectItem>
                    <SelectItem value="Low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeClass(riskScoring)}`}
                >
                  {riskScoring}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Rationale */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Rationale
                </span>
                <ModifiedStatus
                  enabled={overrideConfirmed && !isOverrideEditing}
                  original={original.rationale}
                  current={rationale}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <div className="space-y-1">
                  <Textarea
                    rows={5}
                    value={rationaleText}
                    onChange={(e) => setRationale(parseLines(e.target.value))}
                    placeholder="One rationale point per line..."
                  />
                  <p className="text-xs text-muted-foreground">
                    One point per line
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {rationale.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Decision Required */}
          <DecisionAction
            acceptLabel="Accept & Continue to Risk & Criticality Evaluation"
            acceptLoadingLabel="Generating Risk & Criticality Evaluation..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Assessment"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Assessment"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isRunningRisk}
            error={riskError}
            errorTitle="Risk & criticality evaluation failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs the risk & criticality evaluation — it only starts now, not before you decide."
          />
        </div>

        {/* Override justification dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Change Impact Assessment"
          subjectLabel="the assessment"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isRunningRisk}
        />

        {/* Reject dialog */}
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