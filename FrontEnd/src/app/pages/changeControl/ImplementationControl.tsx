import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../../utils/api";
import {
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
import { AlertTriangle, ClipboardCheck, Loader2, Sparkles } from "lucide-react";
import {
  aiField,
  markModified,
  type ImplementationControlProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type { ImplementationControlParsed } from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";
import { nestedToFlatChangeImpactAssessment } from "../../../utils/changeImpactAdapter";
import {
  flatToNestedImplementationControl,
  nestedToFlatValidationTesting,
} from "../../../utils/changeControlAdapters";

//Helpers
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

//Component
export function ImplementationControl() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const implementationParsed =
    result?.stages?.implementationControl?.parsed ?? null;

  //Auto-generate the AI recommendation for this stage the first time it's
  //visited, mirroring how earlier stages hand data forward on Accept.
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || implementationParsed || isGenerating) return;

    let cancelled = false;
    setIsGenerating(true);
    setGenerateError(null);

    const changeImpactAssessmentParsed =
      result.stages?.changeImpactAssessment?.parsed ?? null;
    const validationTestingParsed =
      result.stages?.validationTesting?.parsed ?? null;

    apiFetch<any>("/api/change-control/implementation-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: result.query,
        changeImpactAssessment: changeImpactAssessmentParsed
          ? nestedToFlatChangeImpactAssessment(changeImpactAssessmentParsed)
          : null,
        riskCriticality: result.stages?.riskCriticality?.parsed ?? null,
        validationTesting: validationTestingParsed
          ? nestedToFlatValidationTesting(validationTestingParsed)
          : null,
      }),
    })
      .then((res) => {
        if (cancelled) return;
        const rawStage = res?.stages?.implementationControl;
        mergePipelineResult({
          stages: {
            ...result.stages,
            implementationControl: rawStage
              ? {
                  ...rawStage,
                  parsed: rawStage.parsed
                    ? flatToNestedImplementationControl(rawStage.parsed)
                    : null,
                }
              : undefined,
          },
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setGenerateError(
          err instanceof Error
            ? err.message
            : "Something went wrong generating implementation & control actions. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, implementationParsed]);

  const savedProvenance = result?.provenance?.implementationControl;
  const wasModified =
    savedProvenance?.required_actions?.source === "modified" ||
    savedProvenance?.sop_wi_updates?.source === "modified" ||
    savedProvenance?.approval_routing?.source === "modified" ||
    savedProvenance?.implementation_plan?.source === "modified" ||
    savedProvenance?.rollback_contingency_plan?.source === "modified";

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);
  const [implementationAccepted, setImplementationAccepted] = useState(false);

  const [requiredActions, setRequiredActions] = useState(
    wasModified
      ? linesToText(savedProvenance!.required_actions.value)
      : linesToText(implementationParsed?.required_actions ?? []),
  );
  const [sopWiUpdates, setSopWiUpdates] = useState(
    wasModified
      ? linesToText(savedProvenance!.sop_wi_updates.value)
      : linesToText(implementationParsed?.sop_wi_updates ?? []),
  );
  const [approvalRouting, setApprovalRouting] = useState(
    wasModified
      ? linesToText(savedProvenance!.approval_routing.value)
      : linesToText(implementationParsed?.approval_routing ?? []),
  );
  const [implementationPlan, setImplementationPlan] = useState(
    wasModified
      ? (savedProvenance!.implementation_plan.value as string)
      : (implementationParsed?.implementation_plan ?? ""),
  );
  const [rollbackPlan, setRollbackPlan] = useState(
    wasModified
      ? (savedProvenance!.rollback_contingency_plan.value as string)
      : (implementationParsed?.rollback_contingency_plan ?? ""),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // Re-hydrate local editable state whenever a new AI result lands in the
  // store (mirrors the pattern used on RiskCriticality.tsx).
  useEffect(() => {
    if (!implementationParsed) return;
    setRequiredActions(linesToText(implementationParsed.required_actions));
    setSopWiUpdates(linesToText(implementationParsed.sop_wi_updates));
    setApprovalRouting(linesToText(implementationParsed.approval_routing));
    setImplementationPlan(implementationParsed.implementation_plan);
    setRollbackPlan(implementationParsed.rollback_contingency_plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implementationParsed]);

  //Guard: no submission yet
  if (!result || !classificationParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No change control data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and start a new submission first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Guard: still generating / failed to generate and nothing to show yet
  if (!implementationParsed) {
    return (
      <div className="relative h-full w-full">
        <div className="min-h-screen p-6">
          <StepProgressBar
            classification={classificationParsed?.classification}
          />
          <Card>
            <CardContent className="py-12 text-center">
              {isGenerating ? (
                <>
                  <Loader2 className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-spin" />
                  <p className="text-foreground font-medium">
                    Generating implementation &amp; control actions…
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will only take a moment.
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-foreground font-medium">
                    No implementation &amp; control actions found.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generateError ??
                      "Please go back and complete the Validation & Testing strategy first."}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() =>
                      navigate("/change-control/validation-testing")
                    }
                  >
                    Go Back
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const decisionMade =
    implementationAccepted || isOverrideEditing || overrideConfirmed;

  //Provenance + approved result builders
  const buildProvenance = (
    confirmed: boolean,
  ): ImplementationControlProvenance => {
    const curRequiredActions = parseLines(requiredActions);
    const curSopWiUpdates = parseLines(sopWiUpdates);
    const curApprovalRouting = parseLines(approvalRouting);

    return {
      required_actions:
        confirmed &&
        JSON.stringify(curRequiredActions) !==
          JSON.stringify(implementationParsed.required_actions)
          ? markModified(
              aiField(implementationParsed.required_actions),
              curRequiredActions,
            )
          : aiField(implementationParsed.required_actions),
      sop_wi_updates:
        confirmed &&
        JSON.stringify(curSopWiUpdates) !==
          JSON.stringify(implementationParsed.sop_wi_updates)
          ? markModified(
              aiField(implementationParsed.sop_wi_updates),
              curSopWiUpdates,
            )
          : aiField(implementationParsed.sop_wi_updates),
      approval_routing:
        confirmed &&
        JSON.stringify(curApprovalRouting) !==
          JSON.stringify(implementationParsed.approval_routing)
          ? markModified(
              aiField(implementationParsed.approval_routing),
              curApprovalRouting,
            )
          : aiField(implementationParsed.approval_routing),
      implementation_plan:
        confirmed &&
        implementationPlan !== implementationParsed.implementation_plan
          ? markModified(
              aiField(implementationParsed.implementation_plan),
              implementationPlan,
            )
          : aiField(implementationParsed.implementation_plan),
      rollback_contingency_plan:
        confirmed &&
        rollbackPlan !== implementationParsed.rollback_contingency_plan
          ? markModified(
              aiField(implementationParsed.rollback_contingency_plan),
              rollbackPlan,
            )
          : aiField(implementationParsed.rollback_contingency_plan),
      confidence_score: implementationParsed.confidence_score,
    };
  };

  const buildApprovedImplementation = (): ImplementationControlParsed => ({
    ...implementationParsed,
    required_actions: parseLines(requiredActions),
    sop_wi_updates: parseLines(sopWiUpdates),
    approval_routing: parseLines(approvalRouting),
    implementation_plan: implementationPlan,
    rollback_contingency_plan: rollbackPlan,
  });

  const proceed = () => {
    const provenance = buildProvenance(overrideConfirmed);
    mergePipelineResult({
      stages: {
        ...result.stages,
        implementationControl: {
          ...result.stages.implementationControl!,
          parsed: buildApprovedImplementation(),
        },
      },
      provenance: { ...result.provenance, implementationControl: provenance },
    });
    navigate("/change-control/summary");
  };

  //Handlers
  const handleAccept = () => setImplementationAccepted(true);
  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (wasModified) {
      setRequiredActions(linesToText(savedProvenance!.required_actions.value));
      setSopWiUpdates(linesToText(savedProvenance!.sop_wi_updates.value));
      setApprovalRouting(linesToText(savedProvenance!.approval_routing.value));
      setImplementationPlan(
        savedProvenance!.implementation_plan.value as string,
      );
      setRollbackPlan(
        savedProvenance!.rollback_contingency_plan.value as string,
      );
    } else {
      setRequiredActions(linesToText(implementationParsed.required_actions));
      setSopWiUpdates(linesToText(implementationParsed.sop_wi_updates));
      setApprovalRouting(linesToText(implementationParsed.approval_routing));
      setImplementationPlan(implementationParsed.implementation_plan);
      setRollbackPlan(implementationParsed.rollback_contingency_plan);
    }
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

  const confidenceScore = implementationParsed.confidence_score;
  const riskLevel = riskParsed
    ? `${riskParsed.data_integrity_risk.level === "High" || riskParsed.patient_safety_product_quality_impact.level === "High" || riskParsed.regulatory_impact.level === "High" || riskParsed.operational_disruption_risk.level === "High" ? "High" : riskParsed.data_integrity_risk.level === "Moderate" || riskParsed.patient_safety_product_quality_impact.level === "Moderate" || riskParsed.regulatory_impact.level === "Moderate" || riskParsed.operational_disruption_risk.level === "Moderate" ? "Moderate" : "Low"} Risk`
    : null;

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={classificationParsed.classification}
          implementationAccepted={implementationAccepted}
        />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          cancelDisabled={implementationAccepted}
        />

        <div className="space-y-6">
          {/* Confidence */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Overall AI Confidence Score
              </CardTitle>
              {riskLevel && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ({riskLevel} System Rationale)
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Based on Implementation &amp; Control Actions
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {confidenceScore}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
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

          {/* Required Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Required Actions
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="requiredActions">
                    Config updates, documentation updates, training — one action
                    per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={implementationParsed.required_actions.join(
                        "\n",
                      )}
                      current={requiredActions}
                    />
                  )}
                </div>
                <Textarea
                  id="requiredActions"
                  rows={4}
                  value={requiredActions}
                  onChange={(e) => setRequiredActions(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* SOP / WI Updates Required */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                SOP / WI Updates Required
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="sopWiUpdates">
                    One SOP / Work Instruction per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={implementationParsed.sop_wi_updates.join("\n")}
                      current={sopWiUpdates}
                    />
                  )}
                </div>
                <Textarea
                  id="sopWiUpdates"
                  rows={3}
                  value={sopWiUpdates}
                  onChange={(e) => setSopWiUpdates(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Approval Routing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Approval Routing
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="approvalRouting">
                    Who must sign off — one role per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={implementationParsed.approval_routing.join(
                        "\n",
                      )}
                      current={approvalRouting}
                    />
                  )}
                </div>
                <Textarea
                  id="approvalRouting"
                  rows={3}
                  value={approvalRouting}
                  onChange={(e) => setApprovalRouting(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Implementation Plan + Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="implementationPlan">
                    Plan and timeline for rolling out this change
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={implementationParsed.implementation_plan}
                      current={implementationPlan}
                    />
                  )}
                </div>
                <Textarea
                  id="implementationPlan"
                  rows={4}
                  value={implementationPlan}
                  onChange={(e) => setImplementationPlan(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Rollback / Contingency Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="rollbackPlan">
                    What happens if the change needs to be reversed
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={implementationParsed.rollback_contingency_plan}
                      current={rollbackPlan}
                    />
                  )}
                </div>
                <Textarea
                  id="rollbackPlan"
                  rows={4}
                  value={rollbackPlan}
                  onChange={(e) => setRollbackPlan(e.target.value)}
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
            acceptLabel="Accept Implementation Plan"
            onAccept={handleAccept}
            acceptDisabled={decisionMade}
            acceptSelected={implementationAccepted}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Implementation Plan"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            overrideDisabled={decisionMade}
            overrideSelected={overrideConfirmed}
            saveChangesDisabled={implementationAccepted}
            rejectLabel="Reject Implementation Plan"
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
              Get Final Summary
            </Button>
          </div>
        </div>

        {/* Override Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Implementation Plan"
          subjectLabel="the implementation & control actions"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Implementation Plan"
          description="Please provide a reason for rejecting this implementation plan. You will be redirected to the intake form. This will be recorded in the audit trail."
          subjectLabel="the implementation & control actions"
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
