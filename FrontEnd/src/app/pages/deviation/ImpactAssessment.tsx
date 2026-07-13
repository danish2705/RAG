import { useNavigate } from "react-router";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useImpactAssessmentReview } from "../../hooks/deviation/useImpactAssessmentReview";
import {
  NoImpactDataGuard,
  ImpactConfidenceCard,
  ImpactAssessmentCard,
  DescriptionWarningDialog,
} from "../../components/deviation/ImpactCards";

export function ImpactAssessment() {
  const navigate = useNavigate();
  const {
    result,
    classificationParsed,
    impactParsed,
    chatOpen,
    setChatOpen,
    assessments,
    isOverrideEditing,
    overrideConfirmed,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    showDescriptionWarning,
    setShowDescriptionWarning,
    warningCards,
    isGeneratingRCA,
    rcaError,
    updateSeverity,
    updateDescription,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  } = useImpactAssessmentReview();

  if (!impactParsed || !classificationParsed) {
    return <NoImpactDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar classification={classificationParsed.classification} />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overriden"
        />

        <div className="space-y-6">
          <ImpactConfidenceCard
            score={impactParsed.confidence_score}
            classificationName={classificationParsed.classification}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assessments.map((assessment, index) => (
              <ImpactAssessmentCard
                key={assessment.key}
                assessment={assessment}
                index={index}
                isOverrideEditing={isOverrideEditing}
                overrideConfirmed={overrideConfirmed}
                onSeverityChange={updateSeverity}
                onDescriptionChange={updateDescription}
              />
            ))}
          </div>

          <DecisionAction
            acceptLabel="Accept & Continue to Root Cause Analysis"
            acceptLoadingLabel="Generating Root Cause Analysis..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Assessment"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Assessment"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isGeneratingRCA}
            error={rcaError}
            errorTitle="Root cause analysis failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs root cause analysis — it only starts now, not before you decide."
          />
        </div>

        <DescriptionWarningDialog
          open={showDescriptionWarning}
          onOpenChange={setShowDescriptionWarning}
          warningCards={warningCards}
        />

        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Impact Assessment"
          subjectLabel="the assessment"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isGeneratingRCA}
        />

        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Impact Assessment"
          description="Please provide a reason for rejecting this assessment. This will be recorded in the audit trail."
          subjectLabel="the impact assessment"
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
