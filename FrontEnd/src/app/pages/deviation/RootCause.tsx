import { useNavigate } from "react-router";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useRootCauseReview } from "../../hooks/deviation/useRootCauseReview";
import {
  NoRcaDataGuard,
  RcaConfidenceCard,
  PrimaryRootCauseCard,
  ListTextareaCard,
} from "../../components/deviation/RootCauseCards";

export function RootCause() {
  const navigate = useNavigate();
  const {
    result,
    rcaParsed,
    chatOpen,
    setChatOpen,
    isOverrideEditing,
    overrideConfirmed,
    primaryRootCause,
    setPrimaryRootCause,
    immediateCause,
    setImmediateCause,
    contributingFactors,
    setContributingFactors,
    evidence,
    setEvidence,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    isGeneratingCAPA,
    capaError,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  } = useRootCauseReview();

  if (!rcaParsed || !result) {
    return <NoRcaDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={result.stages?.classification?.parsed?.classification}
        />

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          cancelDisabled={isGeneratingCAPA}
        />

        <div className="space-y-6">
          <RcaConfidenceCard score={rcaParsed.confidence_score} />

          <PrimaryRootCauseCard
            primaryCause={primaryRootCause}
            originalPrimaryCause={rcaParsed.primary_root_cause}
            immediateCause={immediateCause}
            originalImmediateCause={rcaParsed.immediate_cause}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onPrimaryChange={setPrimaryRootCause}
            onImmediateChange={setImmediateCause}
          />

          <ListTextareaCard
            title="Contributing Factors"
            label="One factor per line"
            value={contributingFactors}
            originalValue={(rcaParsed.contributing_factors ?? []).join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setContributingFactors}
          />

          <ListTextareaCard
            title="Supporting Evidence"
            label="One item per line"
            value={evidence}
            originalValue={(rcaParsed.evidence ?? []).join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setEvidence}
          />

          <DecisionAction
            acceptLabel="Accept & Continue to CAPA"
            acceptLoadingLabel="Generating CAPA..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Root Cause"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Root Cause"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isGeneratingCAPA}
            error={capaError}
            errorTitle="CAPA generation failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding generates CAPA recommendations — it only starts now, not before you decide."
          />
        </div>

        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Root Cause"
          subjectLabel="the root cause analysis"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isGeneratingCAPA}
        />

        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Root Cause"
          description="Please provide a reason for rejecting this root cause analysis. You will be redirected to the deviation form. This will be recorded in the audit trail."
          subjectLabel="the root cause analysis"
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
