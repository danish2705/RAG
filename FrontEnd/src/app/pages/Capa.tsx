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
import { AlertTriangle, Save, Sparkles, PenLine } from "lucide-react";
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
  type CAPAProvenance,
  type ClassificationProvenance,
  type ImpactAssessmentProvenance,
  type RCAProvenance,
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
    capa?: CAPAStage;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
  provenance?: {
    classification?: ClassificationProvenance;
    impactAssessment?: ImpactAssessmentProvenance;
    rca?: RCAProvenance;
    capa?: CAPAProvenance;
  };
}

export function Capa() {
  const navigate = useNavigate();
  const location = useLocation();

  const { result } = (location.state ?? {}) as { result?: PipelineResult };
  const capaParsed = result?.stages?.capa?.parsed ?? null;

  // If this stage was previously overridden (e.g. user navigated forward
  // then came back), restore that state from the saved provenance so the
  // "Modified" badge and edited values persist across back-navigation.
  const savedCapaProvenance = result?.provenance?.capa;
  const wasModified =
    savedCapaProvenance?.corrective_actions?.source === "modified" ||
    savedCapaProvenance?.preventive_actions?.source === "modified" ||
    savedCapaProvenance?.effectiveness_check?.source === "modified" ||
    savedCapaProvenance?.due_date?.source === "modified";

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);
  const [capaAccepted, setCapaAccepted] = useState(false);
  const [correction, setCorrection] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState(
    wasModified
      ? (savedCapaProvenance!.corrective_actions.value as string[]).join(
          "\n",
        )
      : (capaParsed?.corrective_actions ?? []).join("\n"),
  );
  const [preventiveAction, setPreventiveAction] = useState(
    wasModified
      ? (savedCapaProvenance!.preventive_actions.value as string[]).join(
          "\n",
        )
      : (capaParsed?.preventive_actions ?? []).join("\n"),
  );
  const [effectivenessCheck, setEffectivenessCheck] = useState(
    wasModified
      ? (savedCapaProvenance!.effectiveness_check.value as string)
      : capaParsed?.effectiveness_check ?? "",
  );
  const [dueDate, setDueDate] = useState(
    wasModified
      ? (savedCapaProvenance!.due_date.value as string)
      : capaParsed?.due_date ?? "",
  );
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

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

  const decisionMade = capaAccepted || isOverrideEditing || overrideConfirmed;

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    if (isOverrideEditing) {
      setShowWeakCapaWarning(value.length > 0 && value.length < 50);
    }
  };

  /** Build CAPAProvenance from current state */
  const buildCAPAProvenance = (confirmed: boolean): CAPAProvenance => {
    const curCorrectiveActions = correctiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const curPreventiveActions = preventiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      capa_required: capaParsed.capa_required,
      confidence_score: capaParsed.confidence_score,
      corrective_actions:
        confirmed &&
        JSON.stringify(curCorrectiveActions) !==
          JSON.stringify(capaParsed.corrective_actions)
          ? markModified(
              aiField(capaParsed.corrective_actions),
              curCorrectiveActions,
            )
          : aiField(capaParsed.corrective_actions),
      preventive_actions:
        confirmed &&
        JSON.stringify(curPreventiveActions) !==
          JSON.stringify(capaParsed.preventive_actions)
          ? markModified(
              aiField(capaParsed.preventive_actions),
              curPreventiveActions,
            )
          : aiField(capaParsed.preventive_actions),
      effectiveness_check:
        confirmed && effectivenessCheck !== capaParsed.effectiveness_check
          ? markModified(
              aiField(capaParsed.effectiveness_check),
              effectivenessCheck,
            )
          : aiField(capaParsed.effectiveness_check),
      due_date:
        confirmed && dueDate !== capaParsed.due_date
          ? markModified(aiField(capaParsed.due_date), dueDate)
          : aiField(capaParsed.due_date),
    };
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
    const capaProvenance = buildCAPAProvenance(overrideConfirmed);
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
          provenance: {
            ...result.provenance,
            capa: capaProvenance,
          },
        },
      },
    });
  };

  const handleAccept = () => setCapaAccepted(true);
  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (wasModified) {
      setCorrectiveAction(
        (savedCapaProvenance!.corrective_actions.value as string[]).join(
          "\n",
        ),
      );
      setPreventiveAction(
        (savedCapaProvenance!.preventive_actions.value as string[]).join(
          "\n",
        ),
      );
      setEffectivenessCheck(
        savedCapaProvenance!.effectiveness_check.value as string,
      );
      setDueDate(savedCapaProvenance!.due_date.value as string);
    } else {
      setCorrectiveAction((capaParsed.corrective_actions ?? []).join("\n"));
      setPreventiveAction((capaParsed.preventive_actions ?? []).join("\n"));
      setEffectivenessCheck(capaParsed.effectiveness_check ?? "");
      setDueDate(capaParsed.due_date ?? "");
    }
    setShowWeakCapaWarning(false);
    setIsOverrideEditing(false);
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

  /** Field-level badge helper */
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border select-none bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
        <Sparkles className="h-3 w-3" />
        Modified
      </span>
    );
  };

  return (
    <div className="p-6 w-full">
      <StepProgressBar
        classification={result?.stages?.classification?.parsed?.classification}
        capaAccepted={capaAccepted}
      />
      <div className="mb-6 flex items-center justify-end gap-3">
        {isOverrideEditing && (
          <>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
              Editing
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOverride}
              disabled={capaAccepted}
            >
              Cancel Override
            </Button>
          </>
        )}
        {overrideConfirmed && !isOverrideEditing && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-sm px-3 py-1">
            Overridden
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
              <span className="text-sm text-gray-600">
                Based on CAPA recommendations
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {capaParsed.confidence_score}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  capaParsed.confidence_score >= 80
                    ? "bg-green-500"
                    : capaParsed.confidence_score >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${capaParsed.confidence_score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Correction — always editable */}
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

        {/* Corrective Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Corrective Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="correctiveAction">
                  Corrective Action (What will prevent THIS deviation from
                  recurring?) — one action per line
                </Label>
                {!isOverrideEditing && (
                  <FieldBadge
                    original={capaParsed.corrective_actions.join("\n")}
                    current={correctiveAction}
                  />
                )}
              </div>
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

        {/* Preventive Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preventive Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="preventiveAction">
                  Preventive Action (What will prevent SIMILAR deviations?) —
                  one action per line
                </Label>
                {!isOverrideEditing && (
                  <FieldBadge
                    original={capaParsed.preventive_actions.join("\n")}
                    current={preventiveAction}
                  />
                )}
              </div>
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

        {/* Effectiveness Check & Due Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Effectiveness Check & Due Date
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="effectivenessCheck">Effectiveness Check</Label>
                {!isOverrideEditing && (
                  <FieldBadge
                    original={capaParsed.effectiveness_check}
                    current={effectivenessCheck}
                  />
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                {!isOverrideEditing && (
                  <FieldBadge
                    original={capaParsed.due_date}
                    current={dueDate}
                  />
                )}
              </div>
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
                disabled={decisionMade}
                className={`flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 ${
                  capaAccepted ? "ring-2 ring-offset-2 ring-green-500" : ""
                }`}
              >
                Accept CAPA
              </Button>
              {isOverrideEditing ? (
                <Button
                  onClick={handleSaveChanges}
                  disabled={capaAccepted}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              ) : (
                <Button
                  onClick={handleOverrideClick}
                  variant="outline"
                  disabled={decisionMade}
                  className={`flex-1 disabled:opacity-50 ${
                    overrideConfirmed
                      ? "ring-2 ring-offset-2 ring-orange-500"
                      : ""
                  }`}
                >
                  Override CAPA
                </Button>
              )}
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={decisionMade}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
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
            disabled={!decisionMade}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Summary
          </Button>
        </div>
      </div>

      {/* Override Dialog */}
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