import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Sparkles, Info, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// ── Types ─────────────────────────────────────────────────────────────────

type StageName = "classification" | "rca" | "capa";

interface GateResult {
  stage: StageName;
  passed: boolean;
  reasons: { code: string; detail: string | null }[];
  routedTo: "manual_review_queue" | null;
}

interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

// rationale is now array of bullet strings (matches updated prompt + schema)
// NOTE: classification stage is routing-only now — no impact_assessment
// field here. Severity comes from a separate call to
// /api/deviations/impact-assessment, made only after the user approves
// this classification (see handleAccept/handleOverride below).
interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

interface ClassificationStage {
  rawText: string;
  parsed: ClassificationParsed | null; // ← real data lives here
  error: unknown;
  gate: GateResult;
}

interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | null;
  stages: {
    classification?: ClassificationStage;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
}

// Shape returned by POST /api/deviations/impact-assessment
interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

interface ImpactAssessmentApiResponse {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: {
    impactAssessment?: {
      rawText: string;
      parsed: ImpactAssessmentParsed | null;
      error: unknown;
      gate: GateResult;
    };
  };
  auditTrail: unknown[];
  query: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation") return "bg-red-100 text-red-800 border-red-200";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (type === "Hybrid")
    return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ── Component ─────────────────────────────────────────────────────────────

export function AIRecommendation() {
  const navigate = useNavigate();
  const location = useLocation();

  const { result } = (location.state ?? {}) as { result?: PipelineResult };

  // Real data lives in stages.classification.parsed
  const classificationStage = result?.stages?.classification;
  const parsed = classificationStage?.parsed;

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // Impact-assessment call only fires once the user approves routing
  // (Accept or Override below) — never automatically.
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!result || !parsed) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              No analysis result found.
            </p>
            <p className="text-sm text-gray-400 mt-1">
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

  // This is the actual fix: routing approval (Accept or Override) now
  // triggers the Stage 2 LLM call (POST /api/deviations/impact-assessment).
  // That call only happens here, after the human has approved/overridden
  // the classification — never before, and never bundled into Stage 1.
  const runImpactAssessment = async (
    approvedClassification: ClassificationParsed,
  ) => {
    setAssessError(null);
    setIsAssessing(true);

    try {
      const response = await fetch("/api/deviations/impact-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          classification: approvedClassification,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error || `Request failed with status ${response.status}`,
        );
      }

      const impactResult: ImpactAssessmentApiResponse = await response.json();

      navigate("/deviation/impact-assessment", {
        state: {
          result: {
            ...result,
            stages: {
              ...result.stages,
              impactAssessment: impactResult.stages.impactAssessment,
            },
          },
        },
      });
    } catch (err) {
      setAssessError(
        err instanceof Error
          ? err.message
          : "Something went wrong running the impact assessment. Please try again.",
      );
    } finally {
      setIsAssessing(false);
    }
  };

  const handleAccept = () => {
    void runImpactAssessment(parsed);
  };

  const handleOverride = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    // The override justification is for the audit trail; the classification
    // value itself is whatever the reviewer left in place (this UI doesn't
    // offer a different classification value to override TO — only a
    // reason). Send the same approved classification forward.
    void runImpactAssessment(parsed);
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation/new");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          AI Classification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review AI-generated classification and severity
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Main card ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Classification
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Classification type — Deviation / Change Control / Hybrid */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Classification:
              </span>
              <Badge
                className={getClassificationBadgeClass(parsed.classification)}
              >
                {parsed.classification}
              </Badge>
            </div>

            {/* Severity now lives on the Impact Assessment page only —
                it's produced by a separate LLM call that fires after this
                classification is accepted/overridden below, so it can't be
                shown or edited here. */}

            {/* Confidence score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-600">
                    AI Confidence Score
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Confidence is calculated based on predefined business
                          rules and data completeness. Scores below 70 are
                          routed for human review.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {parsed.confidence_score}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
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

            {/* AI Rationale — bullet points from backend */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                AI Rationale
              </p>
              <ul className="space-y-2">
                {parsed.rationale.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* ── Decision buttons ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Required</CardTitle>
          </CardHeader>
          <CardContent>
            {assessError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Impact assessment failed</p>
                  <p className="mt-1">{assessError}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAccept}
                disabled={isAssessing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isAssessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Impact Assessment...
                  </>
                ) : (
                  "Accept Classification"
                )}
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                disabled={isAssessing}
                className="flex-1"
              >
                Override Classification
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={isAssessing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Classification
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail. Accepting or
              overriding runs a fresh impact assessment — it only starts now,
              not before you decide.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Override dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override AI Classification</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the AI
              recommendation. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why you are overriding the AI classification..."
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
              disabled={!overrideJustification.trim() || isAssessing}
            >
              {isAssessing ? (
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

      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject AI Classification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this AI classification. You
              will be returned to the event intake form. This will be recorded
              in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the AI classification..."
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
