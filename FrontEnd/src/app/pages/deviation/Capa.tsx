import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertBanner,
  DecisionAction,
  ModifiedStatus,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { AlertTriangle, Sparkles } from "lucide-react";
import {
  aiField,
  markModified,
  type CAPAProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type { CAPAResult } from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";

//Component
export function Capa() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const capaParsed = result?.stages?.capa?.parsed ?? null;

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
      ? (savedCapaProvenance!.corrective_actions.value as string[]).join("\n")
      : (capaParsed?.corrective_actions ?? []).join("\n"),
  );
  const [preventiveAction, setPreventiveAction] = useState(
    wasModified
      ? (savedCapaProvenance!.preventive_actions.value as string[]).join("\n")
      : (capaParsed?.preventive_actions ?? []).join("\n"),
  );
  const [effectivenessCheck, setEffectivenessCheck] = useState(
    wasModified
      ? (savedCapaProvenance!.effectiveness_check.value as string)
      : (capaParsed?.effectiveness_check ?? ""),
  );
  const [dueDate, setDueDate] = useState(
    wasModified
      ? (savedCapaProvenance!.due_date.value as string)
      : (capaParsed?.due_date ?? ""),
  );
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  //Guard
  if (!capaParsed || !result) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No CAPA data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and complete the root cause analysis first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation")}>
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

  //Provenance + CAPA builders
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

  //Navigation to summary (store update replaces navigate-with-state)
  const proceed = () => {
    const capaProvenance = buildCAPAProvenance(overrideConfirmed);
    mergePipelineResult({
      stages: {
        ...result.stages,
        capa: { ...result.stages.capa!, parsed: buildApprovedCAPA() },
      },
      correction,
      provenance: { ...result.provenance, capa: capaProvenance },
    });
    navigate("/deviation/summary");
  };

  //Handlers
  const handleAccept = () => setCapaAccepted(true);
  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (wasModified) {
      setCorrectiveAction(
        (savedCapaProvenance!.corrective_actions.value as string[]).join("\n"),
      );
      setPreventiveAction(
        (savedCapaProvenance!.preventive_actions.value as string[]).join("\n"),
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

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
          capaAccepted={capaAccepted}
        />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          cancelDisabled={capaAccepted}
        />

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
                  Based on CAPA recommendations
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {capaParsed.confidence_score}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
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
                    <ModifiedStatus
                      enabled={overrideConfirmed}
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
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
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
                    <ModifiedStatus
                      enabled={overrideConfirmed}
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
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
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
                  <Label htmlFor="effectivenessCheck">
                    Effectiveness Check
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
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
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
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
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Decision Required */}
          <DecisionAction
            acceptLabel="Accept CAPA"
            onAccept={handleAccept}
            acceptDisabled={decisionMade}
            acceptSelected={capaAccepted}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override CAPA"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            overrideDisabled={decisionMade}
            overrideSelected={overrideConfirmed}
            saveChangesDisabled={capaAccepted}
            rejectLabel="Reject CAPA"
            onReject={() => setShowRejectDialog(true)}
            rejectDisabled={decisionMade}
            footerText="Your decision will be logged in the audit trail"
          />

          <div className="flex justify-end">
            <Button
              onClick={proceed}
              disabled={!decisionMade}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Summary
            </Button>
          </div>
        </div>

        {/* Override Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override CAPA"
          subjectLabel="the CAPA"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject CAPA"
          description="Please provide a reason for rejecting this CAPA. You will be redirected to the deviation form. This will be recorded in the audit trail."
          subjectLabel="the CAPA"
          value={rejectJustification}
          onChange={setRejectJustification}
          onCancel={() => setShowRejectDialog(false)}
          onConfirm={handleReject}
        />
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}