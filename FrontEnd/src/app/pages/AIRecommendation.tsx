import { useNavigate } from "react-router";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../components/eventIntake";
import { AIAssistant } from "../components/chat/AiAssistant";
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
    isOverrideEditing,
    setIsOverrideEditing,
    editedClassification,
    setEditedClassification,
    editedRationale,
    setEditedRationale,
    rationaleLines,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    isAssessing,
    assessError,
    overrideConfirmed,
    currentClassification,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
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
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${
          chatOpen ? "pr-80" : "pr-6"
        }`}
      >
        <StepProgressBar classification={parsed.classification} />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overriden"
        />

        <div className="space-y-6">
          <ClassificationCard
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            currentClassification={currentClassification}
            editedClassification={editedClassification}
            setEditedClassification={setEditedClassification}
            confidenceScore={parsed.confidence_score}
            originalRationale={parsed.rationale ?? []}
            editedRationale={editedRationale}
            setEditedRationale={setEditedRationale}
            rationaleLines={rationaleLines}
            originalClassification={parsed.classification}
          />

          <DecisionAction
            acceptLabel="Accept Classification"
            acceptLoadingLabel="Running Impact Assessment..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Classification"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Classification"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isAssessing}
            error={assessError}
            errorTitle="Impact assessment failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs a fresh impact assessment — it only starts now, not before you decide."
          />
        </div>

        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override AI Classification"
          subjectLabel="the AI recommendation"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isAssessing}
        />

        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject AI Classification"
          description="Please provide a reason for rejecting this AI classification. You will be returned to the event intake form. This will be recorded in the audit trail."
          subjectLabel="the AI classification"
          value={rejectJustification}
          onChange={setRejectJustification}
          onCancel={() => setShowRejectDialog(false)}
          onConfirm={handleReject}
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
