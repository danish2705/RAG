import { useState } from "react";
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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AlertTriangle, Sparkles } from "lucide-react";
import {
  aiField,
  markModified,
  type RCAProvenance,
} from "../types/dataProvenance";
import { AIAssistant } from "../components/chat/ai-assistant";
import type { RCAResult, CAPAApiResponse } from "../types/pipeline";
import { useWorkflowStore } from "../store/workflowStore";

export function RootCause() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const rcaParsed = result?.stages?.rca?.parsed ?? null;

  const savedRcaProvenance = result?.provenance?.rca;
  const wasModified =
    savedRcaProvenance?.primary_root_cause?.source === "modified" ||
    savedRcaProvenance?.immediate_cause?.source === "modified" ||
    savedRcaProvenance?.contributing_factors?.source === "modified" ||
    savedRcaProvenance?.evidence?.source === "modified";

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);
  const [primaryRootCause, setPrimaryRootCause] = useState(
    wasModified
      ? (savedRcaProvenance!.primary_root_cause.value as string)
      : (rcaParsed?.primary_root_cause ?? ""),
  );
  const [immediateCause, setImmediateCause] = useState(
    wasModified
      ? (savedRcaProvenance!.immediate_cause.value as string)
      : (rcaParsed?.immediate_cause ?? ""),
  );
  const [contributingFactors, setContributingFactors] = useState(
    wasModified
      ? (savedRcaProvenance!.contributing_factors.value as string[]).join("\n")
      : (rcaParsed?.contributing_factors ?? []).join("\n"),
  );
  const [evidence, setEvidence] = useState(
    wasModified
      ? (savedRcaProvenance!.evidence.value as string[]).join("\n")
      : (rcaParsed?.evidence ?? []).join("\n"),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isGeneratingCAPA, setIsGeneratingCAPA] = useState(false);
  const [capaError, setCapaError] = useState<string | null>(null);

  if (!rcaParsed || !result) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No root cause analysis data found.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Please go back and complete the impact assessment first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buildRCAProvenance = (confirmed: boolean): RCAProvenance => {
    const curFactors = contributingFactors
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const curEvidence = evidence
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      primary_root_cause:
        confirmed && primaryRootCause !== rcaParsed.primary_root_cause
          ? markModified(
              aiField(rcaParsed.primary_root_cause),
              primaryRootCause,
            )
          : aiField(rcaParsed.primary_root_cause),
      immediate_cause:
        confirmed && immediateCause !== rcaParsed.immediate_cause
          ? markModified(aiField(rcaParsed.immediate_cause), immediateCause)
          : aiField(rcaParsed.immediate_cause),
      contributing_factors:
        confirmed &&
        JSON.stringify(curFactors) !==
          JSON.stringify(rcaParsed.contributing_factors)
          ? markModified(aiField(rcaParsed.contributing_factors), curFactors)
          : aiField(rcaParsed.contributing_factors),
      evidence:
        confirmed &&
        JSON.stringify(curEvidence) !== JSON.stringify(rcaParsed.evidence)
          ? markModified(aiField(rcaParsed.evidence), curEvidence)
          : aiField(rcaParsed.evidence),
      sequence_of_events: rcaParsed.sequence_of_events,
      impact_summary: rcaParsed.impact_summary,
      confidence_score: rcaParsed.confidence_score,
    };
  };

  const buildApprovedRCA = (): RCAResult => ({
    ...rcaParsed,
    primary_root_cause: primaryRootCause,
    immediate_cause: immediateCause,
    contributing_factors: contributingFactors
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    evidence: evidence
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const navigateToCAPA = (
    capaStage: CAPAApiResponse["stages"]["capa"],
    rcaProvenance: RCAProvenance,
    approvedRCA: RCAResult,
  ) => {
    mergePipelineResult({
      stages: {
        ...result.stages,
        rca: { ...result.stages.rca!, parsed: approvedRCA },
        capa: capaStage,
      },
      provenance: { ...result.provenance, rca: rcaProvenance },
    });
    navigate("/deviation/capa");
  };

  const runCAPA = async (rcaProvenance: RCAProvenance) => {
    setCapaError(null);

    const approvedRCA = buildApprovedRCA();
    const approvedClassification = result.stages?.classification?.parsed;
    const approvedImpactAssessment = result.stages?.impactAssessment?.parsed;

    if (!approvedClassification || !approvedImpactAssessment) {
      setCapaError(
        "Missing approved classification or impact assessment data — please go back and complete those steps before generating CAPA.",
      );
      return;
    }

    setIsGeneratingCAPA(true);
    try {
      const capaResult: CAPAApiResponse = await apiFetch(
        "/api/deviations/capa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result.query,
            classification: approvedClassification,
            impactAssessment: approvedImpactAssessment,
            rca: approvedRCA,
          }),
        },
      );
      navigateToCAPA(capaResult.stages.capa, rcaProvenance, approvedRCA);
    } catch (err) {
      setCapaError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating CAPA recommendations. Please try again.",
      );
    } finally {
      setIsGeneratingCAPA(false);
    }
  };

  const handleAccept = () => {
    const rcaProvenance = buildRCAProvenance(overrideConfirmed);
    const existingCAPA = result.stages?.capa;
    const approvedRCA = buildApprovedRCA();

    if (!overrideConfirmed && existingCAPA?.parsed) {
      navigateToCAPA(existingCAPA, rcaProvenance, approvedRCA);
      return;
    }
    void runCAPA(rcaProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (wasModified) {
      setPrimaryRootCause(
        savedRcaProvenance!.primary_root_cause.value as string,
      );
      setImmediateCause(savedRcaProvenance!.immediate_cause.value as string);
      setContributingFactors(
        (savedRcaProvenance!.contributing_factors.value as string[]).join("\n"),
      );
      setEvidence((savedRcaProvenance!.evidence.value as string[]).join("\n"));
    } else {
      setPrimaryRootCause(rcaParsed.primary_root_cause ?? "");
      setImmediateCause(rcaParsed.immediate_cause ?? "");
      setContributingFactors((rcaParsed.contributing_factors ?? []).join("\n"));
      setEvidence((rcaParsed.evidence ?? []).join("\n"));
    }
    setIsOverrideEditing(false);
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

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          cancelDisabled={isGeneratingCAPA}
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
                  Based on root cause analysis
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {rcaParsed.confidence_score}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    rcaParsed.confidence_score >= 80
                      ? "bg-green-500"
                      : rcaParsed.confidence_score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${rcaParsed.confidence_score}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Primary Root Cause */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Primary Root Cause
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="primaryRootCause">
                    Underlying Root Cause
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={rcaParsed.primary_root_cause}
                      current={primaryRootCause}
                    />
                  )}
                </div>
                <Textarea
                  id="primaryRootCause"
                  rows={3}
                  value={primaryRootCause}
                  onChange={(e) => setPrimaryRootCause(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="immediateCause">
                    Immediate Cause (direct trigger)
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={rcaParsed.immediate_cause}
                      current={immediateCause}
                    />
                  )}
                </div>
                <Textarea
                  id="immediateCause"
                  rows={2}
                  value={immediateCause}
                  onChange={(e) => setImmediateCause(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Contributing Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Contributing Factors
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contributingFactors">
                    One factor per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={(rcaParsed.contributing_factors ?? []).join(
                        "\n",
                      )}
                      current={contributingFactors}
                    />
                  )}
                </div>
                <Textarea
                  id="contributingFactors"
                  rows={4}
                  value={contributingFactors}
                  onChange={(e) => setContributingFactors(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Supporting Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Supporting Evidence
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="evidence">One item per line</Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={(rcaParsed.evidence ?? []).join("\n")}
                      current={evidence}
                    />
                  )}
                </div>
                <Textarea
                  id="evidence"
                  rows={4}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Decision Required */}
          <DecisionAction
            acceptLabel="Accept & Continue to CAPA"
            acceptLoadingLabel="Generating CAPA..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Root Cause"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Root Cause"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isGeneratingCAPA}
            error={capaError}
            errorTitle="CAPA generation failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding generates CAPA recommendations — it only starts now, not before you decide."
          />
        </div>

        {/* Override Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Root Cause"
          subjectLabel="the root cause analysis"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isGeneratingCAPA}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Root Cause"
          description="Please provide a reason for rejecting this root cause analysis. You will be redirected to the deviation form. This will be recorded in the audit trail."
          subjectLabel="the root cause analysis"
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