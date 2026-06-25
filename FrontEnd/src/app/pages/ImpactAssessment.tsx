import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { StepProgressBar } from "../components/qms/StepProgressBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AlertTriangle, Sparkles, Loader2, Save, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  aiField,
  markModified,
  type ImpactAssessmentProvenance,
  type ClassificationProvenance,
} from "../types/dataProvenance";
import {AIAssistant}from '../components/chat/ai-assistant';
// ── Types ─────────────────────────────────────────────────────────────────

type StageName = "classification" | "rca" | "capa";

interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

interface ClassificationStage {
  rawText: string;
  parsed: ClassificationParsed | null;
  error: unknown;
  gate: unknown;
}

interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

interface ImpactAssessmentStage {
  rawText: string;
  parsed: ImpactAssessmentParsed | null;
  error: unknown;
  gate: unknown;
}

interface RCAResult {
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_assessment: string;
  confidence_score: number;
}

interface RCAStage {
  rawText: string;
  parsed: RCAResult | null;
  error: unknown;
  gate: unknown;
}

interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: {
    classification?: ClassificationStage;
    impactAssessment?: ImpactAssessmentStage;
    rca?: RCAStage;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
  provenance?: {
    classification?: ClassificationProvenance;
    impactAssessment?: ImpactAssessmentProvenance;
  };
}

interface RCAApiResponse {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: { rca?: RCAStage };
  auditTrail: unknown[];
  query: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

const PARAMETER_LABELS: Record<string, string> = {
  product_impact: "Product Impact",
  patient_impact: "Patient Impact",
  data_integrity_impact: "Data Integrity Impact",
  compliance_impact: "Compliance Impact",
};

// ── Component ─────────────────────────────────────────────────────────────

export function ImpactAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const { result } = (location.state ?? {}) as { result?: PipelineResult };
  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;

  const initialAssessments = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: PARAMETER_LABELS[key] ?? key,
        severity: val.severity as "None" | "Minor" | "Major" | "Critical",
        description: val.rationale,
        originalSeverity: val.severity as
          | "None"
          | "Minor"
          | "Major"
          | "Critical",
        originalDescription: val.rationale,
        // true when the dropdown value was changed but description not yet updated
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

  // Warning dialog: shown when user tries to Save Changes but some cards have
  // a changed dropdown with the description still unchanged.
  const [showDescriptionWarning, setShowDescriptionWarning] = useState(false);
  const [warningCards, setWarningCards] = useState<string[]>([]);

  const [isGeneratingRCA, setIsGeneratingRCA] = useState(false);
  const [rcaError, setRcaError] = useState<string | null>(null);

  // ── Guard ──────────────────────────────────────────────────────────────
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
            <Button className="mt-4" onClick={() => navigate("/deviation/new")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Field update helpers ───────────────────────────────────────────────

  const updateSeverity = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = {
        ...updated[index],
        severity: value as "None" | "Minor" | "Major" | "Critical",
      };
      // Flag that the dropdown changed — user must update the description too
      item.severityChangedWithoutDescription = value !== item.originalSeverity;
      updated[index] = item;
      return updated;
    });
  };

  const updateDescription = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], description: value };
      // Once they've typed something different, clear the "needs description" flag
      if (value !== item.originalDescription) {
        item.severityChangedWithoutDescription = false;
      }
      updated[index] = item;
      return updated;
    });
  };

  // ── Provenance builder ─────────────────────────────────────────────────

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

  // ── Navigation helpers ─────────────────────────────────────────────────

  const navigateToRCA = (
    rcaStage: RCAStage | undefined,
    impactProvenance: ImpactAssessmentProvenance,
  ) => {
    navigate("/deviation/root-cause", {
      state: {
        result: {
          ...result,
          stages: {
            ...result!.stages,
            impactAssessment: {
              ...result!.stages.impactAssessment,
              parsed: {
                ...impactParsed,
                impact_assessment: Object.fromEntries(
                  assessments.map((a) => [
                    a.key,
                    { severity: a.severity, rationale: a.description },
                  ]),
                ),
              },
            },
            rca: rcaStage,
          },
          provenance: {
            ...result!.provenance,
            impactAssessment: impactProvenance,
          },
        },
      },
    });
  };

  const runRCA = async (impactProvenance: ImpactAssessmentProvenance) => {
    setRcaError(null);
    setIsGeneratingRCA(true);
    try {
      const response = await fetch("/api/deviations/rca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result!.query,
          classification: classificationParsed,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error || `Request failed with status ${response.status}`,
        );
      }
      const rcaResult: RCAApiResponse = await response.json();
      navigateToRCA(rcaResult.stages.rca, impactProvenance);
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
      navigateToRCA(existingRCA, impactProvenance);
      return;
    }
    void runRCA(impactProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  // ── Save Changes: check all cards have updated descriptions ───────────
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? 'pr-80' : 'pr-6'}`}>
      <StepProgressBar
        classification={result?.stages?.classification?.parsed?.classification}
      />

      <div className="mb-6 flex items-center justify-end gap-3">
        {isOverrideEditing && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
            Editing
          </Badge>
        )}
        {overrideConfirmed && !isOverrideEditing && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
            <PenLine className="h-3 w-3 mr-1" /> Modified
          </Badge>
        )}
      </div>

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
                    {/* Only show "Modified" badge — no "AI Generated" label */}
                    {!isOverrideEditing && isAnyModified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 select-none">
                        <PenLine className="h-3 w-3" /> Modified
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isOverrideEditing ? (
                    <>
                      {/* Severity dropdown */}
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
                        {/* Inline nudge if severity changed but description not yet updated */}
                        {assessment.severityChangedWithoutDescription && (
                          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Please update the description below to explain this
                            change.
                          </p>
                        )}
                      </div>

                      {/* Description */}
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
                      {/* Read-only view */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(assessment.severity)}`}
                        >
                          {assessment.severity}
                        </div>
                        {/* Show old → new diff only for severity */}
                        {isSeverityModified && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="line-through text-red-500/70">
                              {assessment.originalSeverity}
                            </span>
                            <span className="text-muted-foreground/40">→</span>
                            <span className="text-green-700 font-medium">
                              {assessment.severity}
                            </span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {assessment.description}
                      </p>

                      {/* Show original AI description if it was changed */}
                      {isDescriptionModified && (
                        <div className="text-xs border-t pt-2 mt-1 space-y-0.5">
                          <p className="font-medium text-orange-600">
                            Previous AI description:
                          </p>
                          <p className="text-red-500/70 line-through leading-relaxed">
                            {assessment.originalDescription}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Decision Required */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Required</CardTitle>
          </CardHeader>
          <CardContent>
            {rcaError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Root cause analysis failed</p>
                  <p className="mt-1">{rcaError}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAccept}
                disabled={isGeneratingRCA || isOverrideEditing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {isGeneratingRCA ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Root Cause Analysis...
                  </>
                ) : (
                  "Accept & Continue to Root Cause Analysis"
                )}
              </Button>
              {isOverrideEditing ? (
                <Button
                  onClick={handleSaveChanges}
                  disabled={isGeneratingRCA}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleOverrideClick}
                  variant="outline"
                  disabled={isGeneratingRCA}
                  className="flex-1"
                >
                  Override Assessment
                </Button>
              )}
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={isGeneratingRCA}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Assessment
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Your decision will be logged in the audit trail. Accepting or
              overriding runs root cause analysis — it only starts now, not
              before you decide.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Description required warning dialog ─────────────────────────── */}
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

      {/* ── Override justification dialog ────────────────────────────────── */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Impact Assessment</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the assessment. This
              will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideJustification">Justification *</Label>
              <Textarea
                id="overrideJustification"
                placeholder="Explain why you are overriding the impact assessment..."
                rows={4}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOverrideDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOverrideConfirm}
              disabled={!overrideJustification.trim() || isGeneratingRCA}
            >
              {isGeneratingRCA ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                "Confirm Override"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ───────────────────────────────────────────────── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Impact Assessment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this assessment. This will
              be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the impact assessment..."
                rows={4}
                value={rejectJustification}
                onChange={(e) => setRejectJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectJustification.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="fixed top-16 right-0 bottom-0 z-40">
            <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
            </div>
    </div>
  );
}