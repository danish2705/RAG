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
import { Sparkles, Info, Edit2, Check, X, AlertTriangle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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
interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
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

// ── Helpers ───────────────────────────────────────────────────────────────

function getSeverityBadgeClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical") return "bg-red-100 text-red-800 border-red-200";
  if (s === "major") return "bg-orange-100 text-orange-800 border-orange-200";
  if (s === "minor") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

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

  const originalSeverity =
    parsed?.impact_assessment?.product_impact?.severity ?? "Minor";
  const [savedSeverity, setSavedSeverity] = useState(originalSeverity);
  const [editedSeverity, setEditedSeverity] = useState(originalSeverity);
  const [isEditingSeverity, setIsEditingSeverity] = useState(false);
  const severityWasEdited = savedSeverity !== originalSeverity;

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

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
            <Button className="mt-4" onClick={() => navigate("/deviation/new")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccept = () =>
    navigate("/deviation/impact-assessment", { state: { result } });
  const handleOverride = () => {
    if (overrideJustification.trim()) {
      setShowOverrideDialog(false);
      navigate("/deviation/impact-assessment", { state: { result } });
    }
  };
  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation/new");
    }
  };
  const handleSaveSeverity = () => {
    setSavedSeverity(editedSeverity);
    setIsEditingSeverity(false);
  };
  const handleCancelSeverity = () => {
    setEditedSeverity(savedSeverity);
    setIsEditingSeverity(false);
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

            {/* Severity — editable */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Severity Level:
              </span>
              {!isEditingSeverity ? (
                <>
                  <Badge className={getSeverityBadgeClass(savedSeverity)}>
                    {savedSeverity}
                  </Badge>
                  {severityWasEdited && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    >
                      Manually Edited
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSeverity(true)}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={editedSeverity}
                    onValueChange={setEditedSeverity}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveSeverity}
                    className="h-7 px-2 text-green-700 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSeverity}
                    className="h-7 px-2 text-gray-600 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Accept Classification
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                className="flex-1"
              >
                Override Classification
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Classification
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail
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
              disabled={!overrideJustification.trim()}
            >
              Confirm Override
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
