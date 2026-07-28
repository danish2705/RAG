import {
  DecisionAction,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { LlmFailureDialog } from "../../components/LlmFailureDialog";
import { useImplementationControl } from "../../hooks/changeControl/useImplementationControl";
import {
  NoChangeControlDataGuard,
  GeneratingImplementationGuard,
  ImplementationConfidenceCard,
  ImplementationTextareaCard,
} from "../../components/changeControl/ImplementationControlCards";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";
import {
  ClipboardList,
  FileText,
  Route,
  ListChecks,
  RotateCcw,
} from "lucide-react";

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
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    decisionMade,
    confidenceScore,
    riskLevel,
    handleAccept,
    handleReject,
    handleGetAiSuggestion,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    llmFailure,
  } = useImplementationControl();

  // Guard: no submission yet
  if (!result || !classificationParsed) {
    return <NoChangeControlDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  // Guard: still generating / failed to generate and nothing to show yet
  if (!implementationParsed) {
    return (
      <>
        <LlmFailureDialog control={llmFailure} />
        <GeneratingImplementationGuard
          classification={classificationParsed?.classification}
          isGenerating={isGenerating}
          generateError={generateError}
          onGoBack={() => navigate("/change-control/validation-testing")}
        />
      </>
    );
  }

  return (
    <div className="relative h-full w-full">
      <LlmFailureDialog control={llmFailure} />
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={classificationParsed.classification}
          implementationAccepted={implementationAccepted}
        />

        <div className="space-y-6">
          <ImplementationConfidenceCard
            score={confidenceScore}
            riskLevel={riskLevel}
            onGetAiSuggestion={showAiSuggestion ? handleGetAiSuggestion : undefined}
          />

          <ImplementationTextareaCard
            icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
            title="Required Actions"
            fieldId="requiredActions"
            label="Config updates, documentation updates, training"
            rows={4}
            value={requiredActions}
            original={implementationParsed.required_actions.join("\n")}
            onChange={setRequiredActions}
          />

          <ImplementationTextareaCard
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            title="SOP / WI Updates Required"
            fieldId="sopWiUpdates"
            label="One SOP / Work Instruction per line"
            rows={3}
            value={sopWiUpdates}
            original={implementationParsed.sop_wi_updates.join("\n")}
            onChange={setSopWiUpdates}
          />

          <ImplementationTextareaCard
            icon={<Route className="h-5 w-5 text-blue-600" />}
            title="Approval Routing"
            fieldId="approvalRouting"
            label="Who must sign off — one role per line"
            rows={3}
            value={approvalRouting}
            original={implementationParsed.approval_routing.join("\n")}
            onChange={setApprovalRouting}
          />

          <ImplementationTextareaCard
            icon={<ListChecks className="h-5 w-5 text-blue-600" />}
            title={IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
            fieldId="implementationPlan"
            label="Plan and timeline for rolling out this change"
            rows={4}
            value={implementationPlan}
            original={implementationParsed.implementation_plan}
            onChange={setImplementationPlan}
          />

          <ImplementationTextareaCard
            icon={<RotateCcw className="h-5 w-5 text-blue-600" />}
            title={
              IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan
            }
            fieldId="rollbackPlan"
            label="What happens if the change needs to be reversed"
            rows={4}
            value={rollbackPlan}
            original={implementationParsed.rollback_contingency_plan}
            onChange={setRollbackPlan}
          />

          {/* Decision Required */}
          <DecisionAction
            onAccept={handleAccept}
            acceptDisabled={decisionMade || !canAccept}
            acceptSelected={implementationAccepted}
            onReject={() => setShowRejectDialog(true)}
            rejectDisabled={decisionMade}
            warning={emptyFieldsWarning}
            footerText="Your decision will be logged in the audit trail"
          />
        </div>

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
