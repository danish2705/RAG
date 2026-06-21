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
import { Pencil, Save, AlertTriangle, Sparkles } from "lucide-react";
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
  parsed: ClassificationParsed | null;
  error: unknown;
  gate: unknown;
}

interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | null;
  stages: { classification?: ClassificationStage };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Maps backend severity (None/Minor/Major/Critical) to display level
function severityToLevel(severity: string): string {
  if (severity === "Critical") return "High";
  if (severity === "Major") return "Medium";
  if (severity === "Minor") return "Low";
  return "None";
}

function getLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "low":
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
  const parsed = result?.stages?.classification?.parsed ?? null;

  // Build assessment rows from real backend data
  const initialAssessments = parsed
    ? Object.entries(parsed.impact_assessment).map(([key, val]) => ({
        key,
        category: PARAMETER_LABELS[key] ?? key,
        severity: val.severity, // None/Minor/Major/Critical
        level: severityToLevel(val.severity), // High/Medium/Low/None
        description: val.rationale,
      }))
    : [];

  const [isEditing, setIsEditing] = useState(false);
  const [assessments, setAssessments] = useState(initialAssessments);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!parsed) {
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

  const handleSave = () => {
    setIsEditing(false);
    alert("Impact Assessment saved successfully");
  };

  const handleAccept = () => {
    // Pass result forward to next page
    navigate("/deviation/root-cause", { state: { result } });
  };

  const handleOverride = () => {
    if (overrideJustification.trim()) {
      setShowOverrideDialog(false);
      navigate("/deviation/root-cause", { state: { result } });
    }
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  // Overall confidence from classification stage
  const confidenceScore = parsed.confidence_score;

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Impact Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Evaluate the impact across critical quality areas
          </p>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel Edit" : "Edit Assessment"}
        </Button>
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
                Based on {parsed.classification} classification
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
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Impact Level
                      </label>
                      <Select
                        value={assessment.level}
                        onValueChange={(value) =>
                          updateAssessment(index, "level", value)
                        }
                      >
                        <SelectTrigger
                          className={getLevelBadgeClass(assessment.level)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">🔴 High</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="Low">🟢 Low</SelectItem>
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
                    {/* Severity from backend + mapped display level */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeClass(assessment.level)}`}
                      >
                        {assessment.level}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500"
                      >
                        {assessment.severity}
                      </Badge>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Accept & Continue to Root Cause Analysis
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                className="flex-1"
              >
                Override Assessment
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Assessment
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/deviation/ai-recommendation", { state: { result } })
            }
          >
            Back
          </Button>
          {isEditing && (
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Override Dialog */}
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
              onClick={handleOverride}
              disabled={!overrideJustification.trim()}
            >
              Confirm Override
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
