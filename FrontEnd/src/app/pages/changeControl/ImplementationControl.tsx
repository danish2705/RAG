import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { Button } from "../../components/ui/button";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useImplementationControl } from "../../hooks/changeControl/useImplementationControl";
import {
  NoChangeControlDataGuard,
  GeneratingImplementationGuard,
  ImplementationConfidenceCard,
  ImplementationTextareaCard,
} from "../../components/changeControl/ImplementationControlCards";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";

export function ImplementationControl() {
  const {
    navigate,
    chatOpen,
    setChatOpen,
    result,
    classificationParsed,
    implementationParsed,
    isGenerating,
    generateError,
    isOverrideEditing,
    overrideConfirmed,
    implementationAccepted,
    requiredActions,
    setRequiredActions,
    sopWiUpdates,
    setSopWiUpdates,
    approvalRouting,
    setApprovalRouting,
    implementationPlan,
    setImplementationPlan,
    rollbackPlan,
    setRollbackPlan,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    decisionMade,
    confidenceScore,
    riskLevel,
    proceed,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  } = useImplementationControl();

  // Guard: no submission yet
  if (!result || !classificationParsed) {
    return <NoChangeControlDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  // Guard: still generating / failed to generate and nothing to show yet
  if (!implementationParsed) {
    return (
      <GeneratingImplementationGuard
        classification={classificationParsed?.classification}
        isGenerating={isGenerating}
        generateError={generateError}
        onGoBack={() => navigate("/change-control/validation-testing")}
      />
    );
  }

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
          <ImplementationConfidenceCard
            score={confidenceScore}
            riskLevel={riskLevel}
          />

          <ImplementationTextareaCard
            title="Required Actions"
            fieldId="requiredActions"
            label="Config updates, documentation updates, training — one action per line"
            rows={4}
            value={requiredActions}
            original={implementationParsed.required_actions.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setRequiredActions}
          />

          <ImplementationTextareaCard
            title="SOP / WI Updates Required"
            fieldId="sopWiUpdates"
            label="One SOP / Work Instruction per line"
            rows={3}
            value={sopWiUpdates}
            original={implementationParsed.sop_wi_updates.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setSopWiUpdates}
          />

          <ImplementationTextareaCard
            title="Approval Routing"
            fieldId="approvalRouting"
            label="Who must sign off — one role per line"
            rows={3}
            value={approvalRouting}
            original={implementationParsed.approval_routing.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setApprovalRouting}
          />

          <ImplementationTextareaCard
            title={IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
            fieldId="implementationPlan"
            label="Plan and timeline for rolling out this change"
            rows={4}
            value={implementationPlan}
            original={implementationParsed.implementation_plan}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setImplementationPlan}
          />

          <ImplementationTextareaCard
            title={
              IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan
            }
            fieldId="rollbackPlan"
            label="What happens if the change needs to be reversed"
            rows={4}
            value={rollbackPlan}
            original={implementationParsed.rollback_contingency_plan}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setRollbackPlan}
          />

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
