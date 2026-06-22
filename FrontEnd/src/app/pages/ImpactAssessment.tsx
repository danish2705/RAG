import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
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
import { AlertTriangle, Sparkles, Loader2, Save } from "lucide-react";
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

// ── Types (from backend) ──────────────────────────────────────────────────

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
      return "bg-red-100 text-red-700 border border-red-200";
    case "major":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "minor":
      return "bg-green-100 text-green-700 border border-green-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
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

  const { result } = (location.state ?? {}) as { result?: PipelineResult };
  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;

  const initialAssessments = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: PARAMETER_LABELS[key] ?? key,
        severity: val.severity,
        description: val.rationale,
      }))
    : [];

  // Override editing state — fields locked by default, unlocked on Override click
  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [assessments, setAssessments] = useState(initialAssessments);

  // Tracks whether the user confirmed an override so the header badge and
  // downstream stages reflect that this assessment was human-modified.
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isGeneratingRCA, setIsGeneratingRCA] = useState(false);
  const [rcaError, setRcaError] = useState<string | null>(null);

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!impactParsed || !classificationParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              No impact assessment data found.
            </p>
            <p className="text-sm text-gray-400 mt-1">
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

  const updateAssessment = (index: number, field: string, value: string) => {
    const updated = [...assessments];
    updated[index] = { ...updated[index], [field]: value };
    setAssessments(updated);
  };

  const runRCA = async () => {
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
              rca: rcaResult.stages.rca,
            },
          },
        },
      });
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
    // If RCA was already generated for this deviation (e.g. the user went
    // Back from a later step) and nothing was overridden on this visit,
    // reuse it instead of calling the AI again.
    const existingRCA = result!.stages?.rca;
    if (!overrideConfirmed && existingRCA?.parsed) {
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
              rca: existingRCA,
            },
          },
        },
      });
      return;
    }

    void runRCA();
  };

  // Step 1: clicking Override Assessment enters edit mode
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

  const confidenceScore = impactParsed.confidence_score;

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 px-2"
          onClick={() =>
            navigate("/deviation/ai-recommendation", {
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
                  },
                },
              },
            })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Impact Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Evaluate the impact across critical quality areas
          </p>
        </div>
        {isOverrideEditing && (
          <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
            Editing
          </Badge>
        )}
        {overrideConfirmed && !isOverrideEditing && (
          <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200 text-sm px-3 py-1">
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
                Based on {classificationParsed.classification} classification
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {confidenceScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  confidenceScore >= 80
                    ? "bg-green-500"
                    : confidenceScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 4 Impact parameter cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessments.map((assessment, index) => (
            <Card key={assessment.key} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{assessment.category}</CardTitle>
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
                          updateAssessment(index, "severity", value)
                        }
                      >
                        <SelectTrigger
                          className={getSeverityBadgeClass(assessment.severity)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical">🔴 Critical</SelectItem>
                          <SelectItem value="Major">🟡 Major</SelectItem>
                          <SelectItem value="Minor">🟢 Minor</SelectItem>
                          <SelectItem value="None">⚪ None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Description
                      </label>
                      <Textarea
                        rows={4}
                        value={assessment.description}
                        onChange={(e) =>
                          updateAssessment(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(assessment.severity)}`}
                      >
                        {assessment.severity}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {assessment.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
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
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail. Accepting or
              overriding runs root cause analysis — it only starts now, not
              before you decide.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog — shown after Save Changes */}
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

      {/* Reject Dialog */}
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
    </div>
  );
}
