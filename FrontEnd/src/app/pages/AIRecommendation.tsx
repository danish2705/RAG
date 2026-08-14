import { useNavigate } from "react-router";
import {
  DecisionAction,
  DiscardDialog,
  StepProgressBar,
} from "../components/eventIntake";
import { AIAssistant } from "../components/chat/AiAssistant";
import { LlmFailureDialog } from "../components/LlmFailureDialog";
import { useClassificationReview } from "../hooks/deviation/useClassificationReview";
import { ClassificationCard } from "../components/deviation/ClassificationCard";
import {
  NoResultGuard,
  InsufficientInputGuard,
  ClassificationFailedGuard,
} from "../components/deviation/ClassificationGuards";

export function AIRecommendation() {
  const navigate = useNavigate();
  const {
    result,
    parsed,
    insufficientInput,
    chatOpen,
    setChatOpen,
    editedClassification,
    setEditedClassification,
    editedRationale,
    setEditedRationale,
    showDiscardDialog,
    setShowDiscardDialog,
    discardJustification,
    setDiscardJustification,
    showAiSuggestion,
    isAssessing,
    assessError,
    emptyFieldsWarning,
    canAccept,
    handleAccept,
    handleDiscard,
    handleGetAiSuggestion,
    llmFailure,
  } = useClassificationReview();

  if (!result) {
    return <NoResultGuard onGoBack={() => navigate("/deviation")} />;
  }

  if (insufficientInput) {
    return (
      <InsufficientInputGuard
        reason={insufficientInput.reason}
        onGoBack={() => navigate("/deviation")}
      />
    );
  }

  if (!parsed) {
    return (
      <ClassificationFailedGuard onGoBack={() => navigate("/deviation")} />
    );
  }

  return (
    <div className="relative h-full w-full">
      <LlmFailureDialog control={llmFailure} />

      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${
          chatOpen ? "pr-80" : "pr-6"
        }`}
      >
        <StepProgressBar classification={parsed.classification} />

        <div className="space-y-6">
          <ClassificationCard
            editedClassification={editedClassification}
            setEditedClassification={setEditedClassification}
            confidenceScore={parsed.confidence_score}
            editedRationale={editedRationale}
            setEditedRationale={setEditedRationale}
            originalClassification={parsed.classification}
            originalRationale={parsed.rationale ?? []}
            onGetAiSuggestion={showAiSuggestion ? handleGetAiSuggestion : undefined}
            rationaleSources={parsed.rationale_sources}
          />

          <DecisionAction
            acceptLoadingLabel="Running Impact Assessment..."
            onAccept={handleAccept}
            acceptDisabled={isAssessing || !canAccept}
            onDiscard={() => setShowDiscardDialog(true)}
            isLoading={isAssessing}
            error={assessError}
            errorTitle="Impact assessment failed"
            warning={emptyFieldsWarning}
            footerText="Your decision will be logged in the audit trail. Accepting runs a fresh impact assessment using whatever is currently in the form above."
          />
        </div>

        <DiscardDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          title="Discard AI Classification"
          description="Please provide a reason for discarding this AI classification. You will be returned to the event intake form. This will be recorded in the audit trail."
          subjectLabel="the AI classification"
          value={discardJustification}
          onChange={setDiscardJustification}
          onCancel={() => setShowDiscardDialog(false)}
          onConfirm={handleDiscard}
        />

        <div className="fixed top-16 right-0 bottom-0 z-40">
          <AIAssistant
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
          />
        </div>
      </div>
    </div>
  );
}