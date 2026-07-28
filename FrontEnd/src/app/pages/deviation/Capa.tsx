import { useNavigate } from "react-router";
import {
  DecisionAction,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useCapaReview } from "../../hooks/deviation/useCapaReview";
import {
  NoCapaDataGuard,
  CapaConfidenceCard,
  CapaCorrectionCard,
  CapaActionCard,
  CapaEffectivenessCard,
} from "../../components/deviation/CapaCards";

export function Capa() {
  const navigate = useNavigate();
  const {
    result,
    capaParsed,
    chatOpen,
    setChatOpen,
    capaAccepted,
    correction,
    setCorrection,
    correctiveAction,
    handleCorrectiveActionChange,
    preventiveAction,
    setPreventiveAction,
    effectivenessCheck,
    setEffectivenessCheck,
    dueDate,
    setDueDate,
    showWeakCapaWarning,
    decisionMade,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    handleAccept,
    handleReject,
    handleGetAiSuggestion,
  } = useCapaReview();

  if (!capaParsed || !result) {
    return <NoCapaDataGuard onGoBack={() => navigate("/deviation")} />;
  }

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

        <div className="space-y-6">
          <CapaConfidenceCard
            score={capaParsed.confidence_score}
            onGetAiSuggestion={showAiSuggestion ? handleGetAiSuggestion : undefined}
          />

          <CapaCorrectionCard value={correction} onChange={setCorrection} />

          <CapaActionCard
            title="Corrective Action"
            label="Corrective Action (What will prevent THIS deviation from recurring?)"
            placeholder="Define specific actions to eliminate the root cause and prevent recurrence..."
            value={correctiveAction}
            originalValue={capaParsed.corrective_actions.join("\n")}
            onChange={handleCorrectiveActionChange}
            showWarning={showWeakCapaWarning}
          />

          <CapaActionCard
            title="Preventive Action"
            label="Preventive Action (What will prevent SIMILAR deviations?)"
            placeholder="Define actions to prevent similar issues in other areas or systems..."
            value={preventiveAction}
            originalValue={capaParsed.preventive_actions.join("\n")}
            onChange={setPreventiveAction}
          />

          <CapaEffectivenessCard
            checkValue={effectivenessCheck}
            originalCheck={capaParsed.effectiveness_check}
            onCheckChange={setEffectivenessCheck}
            dateValue={dueDate}
            originalDate={capaParsed.due_date}
            onDateChange={setDueDate}
          />

          <DecisionAction
            onAccept={handleAccept}
            acceptDisabled={decisionMade || !canAccept}
            acceptSelected={capaAccepted}
            onReject={() => setShowRejectDialog(true)}
            rejectDisabled={decisionMade}
            warning={emptyFieldsWarning}
            footerText="Your decision will be logged in the audit trail"
          />
        </div>

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
