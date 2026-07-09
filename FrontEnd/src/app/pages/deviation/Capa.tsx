import { useNavigate } from "react-router";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { Button } from "../../components/ui/button";
import { AIAssistant } from "../../components/chat/ai-assistant";
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
    result, capaParsed, chatOpen, setChatOpen,
    isOverrideEditing, setIsOverrideEditing, overrideConfirmed, capaAccepted, setCapaAccepted,
    correction, setCorrection, correctiveAction, handleCorrectiveActionChange,
    preventiveAction, setPreventiveAction, effectivenessCheck, setEffectivenessCheck,
    dueDate, setDueDate, showWeakCapaWarning, decisionMade,
    showOverrideDialog, setShowOverrideDialog, overrideJustification, setOverrideJustification,
    showRejectDialog, setShowRejectDialog, rejectJustification, setRejectJustification,
    proceed, handleCancelOverride, handleOverrideConfirm, handleReject
  } = useCapaReview();

  if (!capaParsed || !result) {
    return <NoCapaDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  return (
    <div className="relative h-full w-full">
      <div className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}>
        <StepProgressBar
          classification={result?.stages?.classification?.parsed?.classification}
          capaAccepted={capaAccepted}
        />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          cancelDisabled={capaAccepted}
        />

        <div className="space-y-6">
          <CapaConfidenceCard score={capaParsed.confidence_score} />
          
          <CapaCorrectionCard value={correction} onChange={setCorrection} />

          <CapaActionCard
            title="Corrective Action"
            label="Corrective Action (What will prevent THIS deviation from recurring?) — one action per line"
            placeholder="Define specific actions to eliminate the root cause and prevent recurrence..."
            value={correctiveAction}
            originalValue={capaParsed.corrective_actions.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={handleCorrectiveActionChange}
            showWarning={showWeakCapaWarning}
          />

          <CapaActionCard
            title="Preventive Action"
            label="Preventive Action (What will prevent SIMILAR deviations?) — one action per line"
            placeholder="Define actions to prevent similar issues in other areas or systems..."
            value={preventiveAction}
            originalValue={capaParsed.preventive_actions.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setPreventiveAction}
          />

          <CapaEffectivenessCard
            checkValue={effectivenessCheck}
            originalCheck={capaParsed.effectiveness_check}
            onCheckChange={setEffectivenessCheck}
            dateValue={dueDate}
            originalDate={capaParsed.due_date}
            onDateChange={setDueDate}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
          />

          <DecisionAction
            acceptLabel="Accept CAPA"
            onAccept={() => setCapaAccepted(true)}
            acceptDisabled={decisionMade}
            acceptSelected={capaAccepted}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override CAPA"
            onOverrideClick={() => setIsOverrideEditing(true)}
            onSaveChanges={() => setShowOverrideDialog(true)}
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
        <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
  );
}