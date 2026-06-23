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
import { AlertTriangle, Loader2, Save, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

// ── Types (mirrors backend src/llm/schemas.ts) ──────────────────────────────

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

  // Fields start read-only; unlocked when Override is clicked
  const [isOverrideEditing, setIsOverrideEditing] = useState(false);

  // Tracks whether the user confirmed an override so the header badge and
  // downstream stages reflect that this analysis was human-modified.
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

  // Decision Required state
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

  const runCAPA = async () => {
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
    // If CAPA was already generated for this deviation (e.g. the user went
    // Back from the CAPA step) and nothing was overridden on this visit,
    // reuse it instead of calling the AI again.
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
              rca: {
                ...result.stages.rca,
                parsed: approvedRCA,
              },
              capa: existingCAPA,
            },
          },
        },
      });
      return;
    }

    void runCAPA();
  };

  // Step 1: clicking Override Root Cause enters edit mode
  const handleOverrideClick = () => {
    setIsOverrideEditing(true);
  };

  // Step 2: Save Changes opens the justification dialog
  const handleSaveChanges = () => {
    setShowOverrideDialog(true);
  };

  // Step 3: Confirm closes dialog + returns to read-only with edited values.
  // The user must still explicitly click Accept to proceed.
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
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-3 py-1">
            Overridden
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
              <Label htmlFor="primaryRootCause">Underlying Root Cause</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateCause">
                Immediate Cause (direct trigger)
              </Label>
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
              <Label htmlFor="contributingFactors">One factor per line</Label>
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
              <Label htmlFor="evidence">One item per line</Label>
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

      {/* Override Dialog — shown after Save Changes */}
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
