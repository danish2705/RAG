import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AlertBanner } from "../components/qms/AlertBanner";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
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

// Shape returned by POST /api/deviations/capa
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

  // Editable fields, seeded from the real RCA stage — not mock data.
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

  // CAPA call only fires once the user approves the RCA (Accept or Override
  // below) — never automatically.
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

  // The actual fix: accepting/overriding the RCA now triggers the Stage 4
  // LLM call (POST /api/deviations/capa). That call only happens here,
  // after the human approves — never automatically.
  const runCAPA = async () => {
    setCapaError(null);
    setIsGeneratingCAPA(true);

    // Forward the (possibly human-edited) RCA fields as the "approved RCA"
    // context for CAPA generation, rather than the original unedited
    // parsed object — so edits made on this page actually flow downstream.
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
    void runCAPA();
  };

  const handleOverride = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    void runCAPA();
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Root Cause Analysis
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-generated root cause analysis — review and edit as needed
        </p>
      </div>

      <div className="space-y-6">
        <AlertBanner
          type="info"
          title="AI Suggested – Please review and edit if required"
          message="Fields below have been automatically populated by AI based on the deviation details and historical patterns. Review each section and make any necessary adjustments before proceeding."
        />

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
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated root cause — edit as needed
              </p>
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
                disabled={isGeneratingCAPA}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingCAPA ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating CAPA...
                  </>
                ) : (
                  "Accept Root Cause"
                )}
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                disabled={isGeneratingCAPA}
                className="flex-1"
              >
                Override Root Cause
              </Button>
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

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/deviation/impact-assessment", { state: { result } })
            }
          >
            Back
          </Button>
        </div>
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
              onClick={handleOverride}
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
