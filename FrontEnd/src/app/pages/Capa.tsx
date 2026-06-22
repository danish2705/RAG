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
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AlertBanner } from "../components/qms/AlertBanner";
import { AlertTriangle, Save, Sparkles } from "lucide-react";
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
    capa?: CAPAStage;
    [key: string]: unknown;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
}

export function Capa() {
  const navigate = useNavigate();
  const location = useLocation();

  const { result } = (location.state ?? {}) as { result?: PipelineResult };
  const capaParsed = result?.stages?.capa?.parsed ?? null;

  // Fields: Correction is always editable (not AI-generated).
  // All AI fields start read-only; unlocked only when Override is clicked.
  const [isOverrideEditing, setIsOverrideEditing] = useState(false);

  // Tracks whether the user confirmed an override so the header badge
  // reflects that this CAPA was human-modified.
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  // Tracks whether the user has clicked Accept CAPA — gates the
  // "Get Summary" button until a decision has been made.
  const [capaAccepted, setCapaAccepted] = useState(false);
  const [correction, setCorrection] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState(
    (capaParsed?.corrective_actions ?? []).join("\n"),
  );
  const [preventiveAction, setPreventiveAction] = useState(
    (capaParsed?.preventive_actions ?? []).join("\n"),
  );
  const [effectivenessCheck, setEffectivenessCheck] = useState(
    capaParsed?.effectiveness_check ?? "",
  );
  const [dueDate, setDueDate] = useState(capaParsed?.due_date ?? "");
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

  // Decision Required state
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!capaParsed || !result) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No CAPA data found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Please go back and complete the root cause analysis first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation/new")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    if (isOverrideEditing) {
      setShowWeakCapaWarning(value.length > 0 && value.length < 50);
    }
  };

  const buildApprovedCAPA = (): CAPAResult => ({
    ...capaParsed,
    corrective_actions: correctiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    preventive_actions: preventiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    effectiveness_check: effectivenessCheck,
    due_date: dueDate,
  });

  const proceed = () => {
    navigate("/deviation/summary", {
      state: {
        result: {
          ...result,
          stages: {
            ...result.stages,
            capa: {
              ...result.stages.capa,
              parsed: buildApprovedCAPA(),
            },
          },
          correction,
        },
      },
    });
  };

  // Accepting CAPA no longer navigates away immediately — it just records
  // the decision so the "Get Summary" button becomes available. The user
  // explicitly clicks Get Summary to move on.
  const handleAccept = () => {
    setCapaAccepted(true);
  };

  // Step 1: clicking Override CAPA enters edit mode
  const handleOverrideClick = () => {
    setIsOverrideEditing(true);
  };

  // Step 2: Save Changes opens the justification dialog
  const handleSaveChanges = () => {
    setShowOverrideDialog(true);
  };

  // Step 3: Confirm closes dialog + returns to read-only with edited values.
  // The user must still explicitly click Accept CAPA to proceed.
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
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 px-2"
          onClick={() =>
            navigate("/deviation/root-cause", {
              state: {
                result: {
                  ...result,
                  stages: {
                    ...result.stages,
                    capa: {
                      ...result.stages.capa,
                      parsed: {
                        ...capaParsed,
                        corrective_actions: correctiveAction
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        preventive_actions: preventiveAction
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        effectiveness_check: effectivenessCheck,
                        due_date: dueDate,
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
          <h1 className="text-2xl font-semibold text-gray-900">CAPA</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Corrective and Preventive Actions — review and edit as needed
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
        {/* Correction — always editable (not AI-generated) */}
        <Card>
          <CardHeader>
            <CardTitle>Correction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correction">
                Immediate Correction (What was done to fix the immediate
                problem?)
              </Label>
              <Textarea
                id="correction"
                placeholder="Describe the immediate action taken to address this specific deviation..."
                rows={4}
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Corrective Action — AI-generated, read-only until Override */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Corrective Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correctiveAction">
                Corrective Action (What will prevent THIS deviation from
                recurring?) — one action per line
              </Label>
              <Textarea
                id="correctiveAction"
                placeholder="Define specific actions to eliminate the root cause and prevent recurrence..."
                rows={5}
                value={correctiveAction}
                onChange={(e) => handleCorrectiveActionChange(e.target.value)}
                readOnly={!isOverrideEditing}
                className={
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
            </div>
          </CardContent>
        </Card>

        {showWeakCapaWarning && (
          <AlertBanner
            type="warning"
            title="CAPA May Be Insufficient"
            message="The corrective action appears to be too brief or generic. Consider providing more specific, measurable actions that directly address the root cause."
          />
        )}

        {/* Preventive Action — AI-generated, read-only until Override */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preventive Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="preventiveAction">
                Preventive Action (What will prevent SIMILAR deviations?) — one
                action per line
              </Label>
              <Textarea
                id="preventiveAction"
                placeholder="Define actions to prevent similar issues in other areas or systems..."
                rows={5}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                readOnly={!isOverrideEditing}
                className={
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Effectiveness Check & Due Date — AI-generated, read-only until Override */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Effectiveness Check & Due Date
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="effectivenessCheck">Effectiveness Check</Label>
              <Textarea
                id="effectivenessCheck"
                rows={3}
                value={effectivenessCheck}
                onChange={(e) => setEffectivenessCheck(e.target.value)}
                readOnly={!isOverrideEditing}
                className={
                  !isOverrideEditing ? "bg-gray-100 cursor-default" : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Textarea
                id="dueDate"
                rows={1}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
            <div className="flex gap-4">
              <Button
                onClick={handleAccept}
                disabled={isOverrideEditing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                Accept CAPA
              </Button>
              {isOverrideEditing ? (
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleOverrideClick}
                  variant="outline"
                  className="flex-1"
                >
                  Override CAPA
                </Button>
              )}
              <Button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject CAPA
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={proceed}
            disabled={!capaAccepted}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Summary
          </Button>
        </div>
      </div>

      {/* Override Dialog — shown after Save Changes */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override CAPA</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the CAPA. This will
              be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideJustification">Justification *</Label>
              <Textarea
                id="overrideJustification"
                placeholder="Explain why you are overriding the CAPA..."
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
            <DialogTitle>Reject CAPA</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this CAPA. You will be
              redirected to the deviation form. This will be recorded in the
              audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the CAPA..."
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
