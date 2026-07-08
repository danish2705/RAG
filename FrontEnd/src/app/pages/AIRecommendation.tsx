import { useCallback, useMemo, useState } from "react";
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
import { Sparkles, Info, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  aiField,
  markModified,
  type ClassificationProvenance,
  type DataField,
} from "../types/dataProvenance";
import { AIAssistant } from "../components/chat/ai-assistant";
import type {
  ClassificationParsed,
  ClassificationType,
  ImpactAssessmentApiResponse,
  ChangeImpactAssessmentApiResponse,
} from "../types/pipeline";
import { useWorkflowStore } from "../store/workflowStore";

//Helpers
function parseRationaleLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (type === "Hybrid")
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
  return "bg-muted text-muted-foreground border-border";
}

function getImpactAssessmentRoute(classification: ClassificationType): string {
  return classification === "Change Control"
    ? "/change-control/change-impact-assessment"
    : "/deviation/impact-assessment";
}

//Component
export function AIRecommendation() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationStage = result?.stages?.classification;
  const parsed = classificationStage?.parsed;

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [editedClassification, setEditedClassification] =
    useState<ClassificationType>(parsed?.classification ?? "Deviation");
  const [editedRationale, setEditedRationale] = useState(
    (parsed?.rationale ?? []).join("\n"),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  //Guard
  if (!result || !parsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No analysis result found.
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

  const rationaleLines = useMemo(
    () => parseRationaleLines(editedRationale),
    [editedRationale],
  );

  //Provenance builder
  const buildClassificationProvenance = useCallback(
    (isOverride: boolean): ClassificationProvenance => {
      if (isOverride) {
        return {
          classification: markModified(
            aiField(parsed.classification),
            editedClassification,
          ) as DataField<ClassificationType>,
          rationale: markModified(aiField(parsed.rationale), rationaleLines),
          confidence_score: parsed.confidence_score,
        };
      }
      return {
        classification: aiField(parsed.classification),
        rationale: aiField(parsed.rationale),
        confidence_score: parsed.confidence_score,
      };
    },
    [parsed, editedClassification, rationaleLines],
  );

  //API call + store update
  const runImpactAssessment = useCallback(
    async (
      approvedClassification: ClassificationParsed,
      classificationProvenance: ClassificationProvenance,
    ) => {
      setAssessError(null);
      setIsAssessing(true);

      try {
        if (approvedClassification.classification === "Change Control") {
          const impactResult: ChangeImpactAssessmentApiResponse =
            await apiFetch("/api/change-control/impact-assessment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: result.query,
                classification: approvedClassification,
              }),
            });

          mergePipelineResult({
            stages: {
              ...result.stages,
              classification: {
                ...result.stages.classification!,
                parsed: approvedClassification,
              },
              changeImpactAssessment: impactResult.stages.changeImpactAssessment,
            },
            provenance: {
              ...result.provenance,
              classification: classificationProvenance,
            },
          });
        } else {
          const impactResult: ImpactAssessmentApiResponse = await apiFetch(
            "/api/deviations/impact-assessment",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: result.query,
                classification: approvedClassification,
              }),
            },
          );

          mergePipelineResult({
            stages: {
              ...result.stages,
              classification: {
                ...result.stages.classification!,
                parsed: approvedClassification,
              },
              impactAssessment: impactResult.stages.impactAssessment,
            },
            provenance: {
              ...result.provenance,
              classification: classificationProvenance,
            },
          });
        }

        navigate(getImpactAssessmentRoute(approvedClassification.classification));
      } catch (err) {
        setAssessError(
          err instanceof Error
            ? err.message
            : "Something went wrong running the impact assessment. Please try again.",
        );
      } finally {
        setIsAssessing(false);
      }
    },
    [result, mergePipelineResult, navigate],
  );

  const handleAccept = useCallback(() => {
    const isOverride = overrideConfirmed;
    const approvedClassification: ClassificationParsed = isOverride
      ? {
          ...parsed,
          classification: editedClassification,
          rationale: rationaleLines,
        }
      : parsed;
    const classificationProvenance = buildClassificationProvenance(isOverride);

    const existingChangeImpactAssessment =
      result.stages?.changeImpactAssessment;
    const existingImpactAssessment = result.stages?.impactAssessment;
    const hasCachedImpact =
      approvedClassification.classification === "Change Control"
        ? existingChangeImpactAssessment?.parsed
        : existingImpactAssessment?.parsed;

    if (!isOverride && hasCachedImpact) {
      mergePipelineResult({
        stages: {
          ...result.stages,
          classification: {
            ...result.stages.classification!,
            parsed: approvedClassification,
          },
          ...(approvedClassification.classification === "Change Control"
            ? { changeImpactAssessment: existingChangeImpactAssessment }
            : { impactAssessment: existingImpactAssessment }),
        },
        provenance: {
          ...result.provenance,
          classification: classificationProvenance,
        },
      });
      navigate(getImpactAssessmentRoute(approvedClassification.classification));
      return;
    }

    void runImpactAssessment(approvedClassification, classificationProvenance);
  }, [
    overrideConfirmed,
    parsed,
    editedClassification,
    rationaleLines,
    buildClassificationProvenance,
    result,
    mergePipelineResult,
    navigate,
    runImpactAssessment,
  ]);

  const handleOverrideClick = useCallback(() => setIsOverrideEditing(true), []);
  const handleSaveChanges = useCallback(() => setShowOverrideDialog(true), []);

  const handleCancelOverride = useCallback(() => {
    setIsOverrideEditing(false);
    setEditedClassification(parsed.classification);
    setEditedRationale((parsed.rationale ?? []).join("\n"));
  }, [parsed]);

  const handleOverrideConfirm = useCallback(() => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
  }, [overrideJustification]);

  const handleReject = useCallback(() => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  }, [rejectJustification, navigate]);

  const currentClassification = overrideConfirmed
    ? editedClassification
    : parsed.classification;

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
          {/* Main card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Classification
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Classification type */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">
                  Classification:
                </span>
                {isOverrideEditing ? (
                  <Select
                    value={editedClassification}
                    onValueChange={(v) =>
                      setEditedClassification(v as ClassificationType)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deviation">Deviation</SelectItem>
                      <SelectItem value="Change Control">
                        Change Control
                      </SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Badge
                      className={getClassificationBadgeClass(
                        currentClassification,
                      )}
                    >
                      {currentClassification}
                    </Badge>
                    <ModifiedStatus
                      enabled={overrideConfirmed && !isOverrideEditing}
                      original={parsed.classification}
                      current={editedClassification}
                    />
                  </>
                )}
              </div>

              {/* Confidence score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      AI Confidence Score
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Confidence is calculated based on predefined
                            business rules and data completeness. Scores below
                            70 are routed for human review.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {parsed.confidence_score}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parsed.confidence_score >= 80
                        ? "bg-green-500"
                        : parsed.confidence_score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${parsed.confidence_score}%` }}
                  />
                </div>
              </div>

              {/* AI Rationale */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-medium text-foreground">
                    AI Rationale
                  </p>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={(parsed.rationale ?? []).join("\n").trim()}
                      current={editedRationale.trim()}
                    />
                  )}
                </div>
                {isOverrideEditing ? (
                  <div className="space-y-1">
                    <Textarea
                      rows={5}
                      value={editedRationale}
                      onChange={(e) => setEditedRationale(e.target.value)}
                      placeholder="One rationale point per line..."
                    />
                    <p className="text-xs text-muted-foreground">
                      One point per line
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {rationaleLines.map((point, i) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Decision buttons */}
          <DecisionAction
            acceptLabel="Accept Classification"
            acceptLoadingLabel="Running Impact Assessment..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Classification"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Classification"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isAssessing}
            error={assessError}
            errorTitle="Impact assessment failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs a fresh impact assessment — it only starts now, not before you decide."
          />
        </div>

        {/* Override dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override AI Classification"
          subjectLabel="the AI recommendation"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isAssessing}
        />

        {/* Reject dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject AI Classification"
          description="Please provide a reason for rejecting this AI classification. You will be returned to the event intake form. This will be recorded in the audit trail."
          subjectLabel="the AI classification"
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