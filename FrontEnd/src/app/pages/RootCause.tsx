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
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AlertBanner } from "../components/qms/AlertBanner";
import { AlertTriangle, Loader2, Save, Sparkles, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  aiField,
  markModified,
  type RCAProvenance,
  type ClassificationProvenance,
  type ImpactAssessmentProvenance,
} from "../types/dataProvenance";

// ── Types ─────────────────────────────────────────────────────────────────

type StageName = "classification" | "rca" | "capa";

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

interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

interface CAPAStage {
  rawText: string;
  parsed: CAPAResult | null;
  error: unknown;
  gate: unknown;
}

interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: {
    classification?: ClassificationStage;
    rca?: RCAStage;
    capa?: CAPAStage;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
  provenance?: {
    classification?: ClassificationProvenance;
    impactAssessment?: ImpactAssessmentProvenance;
    rca?: RCAProvenance;
  };
}

interface CAPAApiResponse {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: { capa?: CAPAStage };
  auditTrail: unknown[];
  query: string;
}

export function RootCause() {
  const navigate = useNavigate();
  const location = useLocation();

  const { result } = (location.state ?? {}) as { result?: PipelineResult };
  const rcaParsed = result?.stages?.rca?.parsed ?? null;

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [primaryRootCause, setPrimaryRootCause] = useState(
    rcaParsed?.primary_root_cause ?? "",
  );
  const [immediateCause, setImmediateCause] = useState(
    rcaParsed?.immediate_cause ?? "",
  );
  const [contributingFactors, setContributingFactors] = useState(
    (rcaParsed?.contributing_factors ?? []).join("\n"),
  );
  const [evidence, setEvidence] = useState(
    (rcaParsed?.evidence ?? []).join("\n"),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isGeneratingCAPA, setIsGeneratingCAPA] = useState(false);
  const [capaError, setCapaError] = useState<string | null>(null);

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!rcaParsed || !result) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              No root cause analysis data found.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Please go back and complete the impact assessment first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation/new")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /** Build RCAProvenance based on whether fields were overridden */
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
      impact_assessment: rcaParsed.impact_assessment,
      confidence_score: rcaParsed.confidence_score,
    };
  };

  const runCAPA = async (rcaProvenance: RCAProvenance) => {
    setCapaError(null);
    setIsGeneratingCAPA(true);

    const approvedRCA: RCAResult = {
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
    };

    try {
      const response = await fetch("/api/deviations/capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          rca: approvedRCA,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error || `Request failed with status ${response.status}`,
        );
      }

      const capaResult: CAPAApiResponse = await response.json();

      navigate("/deviation/capa", {
        state: {
          result: {
            ...result,
            stages: {
              ...result.stages,
              rca: {
                ...result.stages.rca,
                parsed: approvedRCA,
              },
              capa: capaResult.stages.capa,
            },
            provenance: {
              ...result.provenance,
              rca: rcaProvenance,
            },
          },
        },
      });
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
    if (!overrideConfirmed && existingCAPA?.parsed) {
      const approvedRCA: RCAResult = {
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
      };

      navigate("/deviation/capa", {
        state: {
          result: {
            ...result,
            stages: {
              ...result.stages,
              rca: { ...result.stages.rca, parsed: approvedRCA },
              capa: existingCAPA,
            },
            provenance: {
              ...result.provenance,
              rca: rcaProvenance,
            },
          },
        },
      });
      return;
    }

    void runCAPA(rcaProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

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

  /** Renders a field label with AI Generated / Modified pill */
  const FieldBadge = ({
    original,
    current,
  }: {
    original: string;
    current: string;
  }) => {
    const isModified = overrideConfirmed && current !== original;
    if (!isModified) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border select-none bg-orange-50 text-orange-700 border-orange-200">
        <PenLine className="h-3 w-3" /> Modified
      </span>
    );
  };

  return (
    <div className="p-6 w-full">
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
            Modified
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* Overall confidence score */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Overall AI Confidence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Based on root cause analysis
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {rcaParsed.confidence_score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
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
                <Label htmlFor="primaryRootCause">Underlying Root Cause</Label>
                {!isOverrideEditing && (
                  <FieldBadge
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
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
              {overrideConfirmed &&
                primaryRootCause !== rcaParsed.primary_root_cause &&
                !isOverrideEditing && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-orange-600">
                      Previous AI value:{" "}
                    </span>
                    <span className="line-through text-red-500/70">
                      {rcaParsed.primary_root_cause}
                    </span>
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="immediateCause">
                  Immediate Cause (direct trigger)
                </Label>
                {!isOverrideEditing && (
                  <FieldBadge
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
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
              {overrideConfirmed &&
                immediateCause !== rcaParsed.immediate_cause &&
                !isOverrideEditing && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-orange-600">
                      Previous AI value:{" "}
                    </span>
                    <span className="line-through text-red-500/70">
                      {rcaParsed.immediate_cause}
                    </span>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

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
                <Label htmlFor="contributingFactors">One factor per line</Label>
                {!isOverrideEditing && (
                  <FieldBadge
                    original={(rcaParsed.contributing_factors ?? []).join("\n")}
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
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
            </div>
          </CardContent>
        </Card>

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
                  <FieldBadge
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
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Decision Required */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Required</CardTitle>
          </CardHeader>
          <CardContent>
            {capaError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">CAPA generation failed</p>
                  <p className="mt-1">{capaError}</p>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Button
                onClick={handleAccept}
                disabled={isGeneratingCAPA || isOverrideEditing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingCAPA ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating CAPA...
                  </>
                ) : (
                  "Accept & Continue to CAPA"
                )}
              </Button>
              {isOverrideEditing ? (
                <Button
                  onClick={handleSaveChanges}
                  disabled={isGeneratingCAPA}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleOverrideClick}
                  variant="outline"
                  disabled={isGeneratingCAPA}
                  className="flex-1"
                >
                  Override Root Cause
                </Button>
              )}
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={isGeneratingCAPA}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Root Cause
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail. Accepting or
              overriding generates CAPA recommendations — it only starts now,
              not before you decide.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Root Cause</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the root cause
              analysis. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideJustification">Justification *</Label>
              <Textarea
                id="overrideJustification"
                placeholder="Explain why you are overriding the root cause analysis..."
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
              disabled={!overrideJustification.trim() || isGeneratingCAPA}
            >
              {isGeneratingCAPA ? (
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Root Cause</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this root cause analysis.
              You will be redirected to the deviation form. This will be
              recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the root cause analysis..."
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
    </div>
  );
}
