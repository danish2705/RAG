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
  type ImpactAssessmentProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type { ImpactSeverity, RCAApiResponse } from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";

//Helpers
function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "major":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "minor":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

//Component
export function ImpactAssessment() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;

  const initialAssessments = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: PARAMETER_LABELS[key] ?? key,
        severity: val.severity as ImpactSeverity,
        description: val.rationale,
        originalSeverity: val.severity as ImpactSeverity,
        originalDescription: val.rationale,
        severityChangedWithoutDescription: false,
      }))
    : [];

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [assessments, setAssessments] = useState(initialAssessments);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showDescriptionWarning, setShowDescriptionWarning] = useState(false);
  const [warningCards, setWarningCards] = useState<string[]>([]);

  const [isGeneratingRCA, setIsGeneratingRCA] = useState(false);
  const [rcaError, setRcaError] = useState<string | null>(null);

  //Guard
  if (!impactParsed || !classificationParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No impact assessment data found.
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
  const updateSeverity = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], severity: value as ImpactSeverity };
      item.severityChangedWithoutDescription = value !== item.originalSeverity;
      updated[index] = item;
      return updated;
    });
  };

  const updateDescription = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], description: value };
      if (value !== item.originalDescription) {
        item.severityChangedWithoutDescription = false;
      }
      updated[index] = item;
      return updated;
    });
  };

  //Provenance builder
  const buildImpactProvenance = (
    confirmed: boolean,
  ): ImpactAssessmentProvenance => {
    const keys = [
      "product_impact",
      "patient_impact",
      "data_integrity_impact",
      "compliance_impact",
    ] as const;

    const entries = Object.fromEntries(
      keys.map((key, i) => {
        const a = assessments[i];
        const modified =
          confirmed &&
          (a?.severity !== a?.originalSeverity ||
            a?.description !== a?.originalDescription);

        return [
          key,
          {
            severity: modified
              ? markModified(aiField(a.originalSeverity), a.severity)
              : aiField(a.originalSeverity),
            rationale: modified
              ? markModified(aiField(a.originalDescription), a.description)
              : aiField(a.originalDescription),
          },
        ];
      }),
    );

    return {
      impact_assessment:
        entries as ImpactAssessmentProvenance["impact_assessment"],
      confidence_score: impactParsed.confidence_score,
    };
  };

  //Approved impact assessment builder — reflects any override edits in
  //`assessments`, in the shape the backend's ImpactAssessmentSchema expects.
  const buildApprovedImpactAssessment = () => ({
    ...impactParsed,
    impact_assessment: Object.fromEntries(
      assessments.map((a) => [
        a.key,
        { severity: a.severity, rationale: a.description },
      ]),
    ) as typeof impactParsed.impact_assessment,
  });

  //Navigation helpers
  const navigateToRCA = (
    rcaStage: RCAApiResponse["stages"]["rca"],
    impactProvenance: ImpactAssessmentProvenance,
    approvedImpactAssessment: ReturnType<typeof buildApprovedImpactAssessment>,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        impactAssessment: {
          ...result!.stages.impactAssessment!,
          parsed: approvedImpactAssessment,
        },
        rca: rcaStage,
      },
      provenance: {
        ...result!.provenance,
        impactAssessment: impactProvenance,
      },
    });
    navigate("/deviation/root-cause");
  };

  const runRCA = async (impactProvenance: ImpactAssessmentProvenance) => {
    setRcaError(null);
    setIsGeneratingRCA(true);
    const approvedImpactAssessment = buildApprovedImpactAssessment();
    try {
      const rcaResult: RCAApiResponse = await apiFetch("/api/deviations/rca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result!.query,
          classification: classificationParsed,
          impactAssessment: approvedImpactAssessment,
        }),
      });
      navigateToRCA(
        rcaResult.stages.rca,
        impactProvenance,
        approvedImpactAssessment,
      );
    } catch (err) {
      setRcaError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating the root cause analysis. Please try again.",
      );
    } finally {
      setIsGeneratingRCA(false);
    }
  };

  const handleAccept = () => {
    const impactProvenance = buildImpactProvenance(overrideConfirmed);
    const existingRCA = result!.stages?.rca;
    if (!overrideConfirmed && existingRCA?.parsed) {
      navigateToRCA(
        existingRCA,
        impactProvenance,
        buildApprovedImpactAssessment(),
      );
      return;
    }
    void runRCA(impactProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsDescription = assessments
      .filter((a) => a.severityChangedWithoutDescription)
      .map((a) => a.category);

    if (needsDescription.length > 0) {
      setWarningCards(needsDescription);
      setShowDescriptionWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    setIsOverrideEditing(false);
    setAssessments((prev) =>
      prev.map((a) => ({
        ...a,
        severity: a.originalSeverity,
        description: a.originalDescription,
        severityChangedWithoutDescription: false,
      })),
    );
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

          {/* 4 Impact cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assessments.map((assessment, index) => {
              const isSeverityModified =
                overrideConfirmed &&
                assessment.severity !== assessment.originalSeverity;
              const isDescriptionModified =
                overrideConfirmed &&
                assessment.description !== assessment.originalDescription;
              const isAnyModified = isSeverityModified || isDescriptionModified;

              return (
                <Card
                  key={assessment.key}
                  className={`shadow-sm ${assessment.severityChangedWithoutDescription && isOverrideEditing ? "ring-2 ring-orange-400" : ""}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {assessment.category}
                      {!isOverrideEditing && isAnyModified && <ModifiedBadge />}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isOverrideEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Impact Level
                          </label>
                          <Select
                            value={assessment.severity}
                            onValueChange={(value) =>
                              updateSeverity(index, value)
                            }
                          >
                            <SelectTrigger
                              className={getSeverityBadgeClass(
                                assessment.severity,
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Critical">
                                🔴 Critical
                              </SelectItem>
                              <SelectItem value="Major">🟡 Major</SelectItem>
                              <SelectItem value="Minor">🟢 Minor</SelectItem>
                              <SelectItem value="None">⚪ None</SelectItem>
                            </SelectContent>
                          </Select>
                          {assessment.severityChangedWithoutDescription && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Please update the description below to explain
                              this change.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Description
                            {assessment.severityChangedWithoutDescription && (
                              <span className="text-orange-600 ml-1">*</span>
                            )}
                          </label>
                          <Textarea
                            rows={4}
                            value={assessment.description}
                            onChange={(e) =>
                              updateDescription(index, e.target.value)
                            }
                            placeholder="Explain the reason for this change..."
                            className={
                              assessment.severityChangedWithoutDescription
                                ? "border-orange-400 focus:ring-orange-400"
                                : ""
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(assessment.severity)}`}
                          >
                            {assessment.severity}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {assessment.description}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Decision Required */}
          <DecisionAction
            acceptLabel="Accept & Continue to Root Cause Analysis"
            acceptLoadingLabel="Generating Root Cause Analysis..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Assessment"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Assessment"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isGeneratingRCA}
            error={rcaError}
            errorTitle="Root cause analysis failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs root cause analysis — it only starts now, not before you decide."
          />
        </div>

        {/* Description required warning dialog */}
        <Dialog
          open={showDescriptionWarning}
          onOpenChange={setShowDescriptionWarning}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Description Update Required
              </DialogTitle>
              <DialogDescription>
                You changed the impact level for the following{" "}
                {warningCards.length === 1 ? "category" : "categories"} but have
                not updated the description to explain the change:
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 space-y-1">
              {warningCards.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Please update the description for each changed category with the
              reason for the new impact level before saving.
            </p>
            <DialogFooter>
              <Button
                onClick={() => setShowDescriptionWarning(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Back & Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override justification dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Impact Assessment"
          subjectLabel="the assessment"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isGeneratingRCA}
        />

        {/* Reject dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Impact Assessment"
          description="Please provide a reason for rejecting this assessment. This will be recorded in the audit trail."
          subjectLabel="the impact assessment"
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
