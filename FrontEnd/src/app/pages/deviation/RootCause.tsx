import { useNavigate } from "react-router";
import {
  DecisionAction,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { LlmFailureDialog } from "../../components/LlmFailureDialog";
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
    primaryRootCause,
    setPrimaryRootCause,
    immediateCause,
    setImmediateCause,
    contributingFactors,
    setContributingFactors,
    evidence,
    setEvidence,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    isGeneratingCAPA,
    capaError,
    handleAccept,
    handleReject,
    llmFailure,
  } = useRootCauseReview();

  if (!rcaParsed || !result) {
    return <NoRcaDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  return (
    <div className="relative h-full w-full">
      <LlmFailureDialog control={llmFailure} />
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={result.stages?.classification?.parsed?.classification}
        />

        <div className="space-y-6">
          <RcaConfidenceCard score={rcaParsed.confidence_score} />

          <PrimaryRootCauseCard
            primaryCause={primaryRootCause}
            originalPrimaryCause={rcaParsed.primary_root_cause}
            immediateCause={immediateCause}
            originalImmediateCause={rcaParsed.immediate_cause}
            onPrimaryChange={setPrimaryRootCause}
            onImmediateChange={setImmediateCause}
          />

          <ListTextareaCard
            title="Contributing Factors"
            label=""
            value={contributingFactors}
            originalValue={(rcaParsed.contributing_factors ?? []).join("\n")}
            onChange={setContributingFactors}
          />

          <ListTextareaCard
            title="Supporting Evidence"
            label=""
            value={evidence}
            originalValue={(rcaParsed.evidence ?? []).join("\n")}
            onChange={setEvidence}
          />

          <DecisionAction
            acceptLoadingLabel="Generating CAPA..."
            onAccept={handleAccept}
            onReject={() => setShowRejectDialog(true)}
            isLoading={isGeneratingCAPA}
            error={capaError}
            errorTitle="CAPA generation failed"
            footerText="Your decision will be logged in the audit trail. Accepting generates CAPA recommendations using whatever is currently in the form above."
          />
        </div>

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
