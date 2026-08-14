import { useNavigate } from "react-router";
import {
  DecisionAction,
  DiscardDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { LlmFailureDialog } from "../../components/LlmFailureDialog";
import { useRootCauseReview } from "../../hooks/deviation/useRootCauseReview";
import { flattenSources } from "../../components/shared/SourcesUsed";
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
    showDiscardDialog,
    setShowDiscardDialog,
    discardJustification,
    setDiscardJustification,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    isGeneratingCAPA,
    capaError,
    handleAccept,
    handleDiscard,
    handleGetAiSuggestion,
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
          <RcaConfidenceCard
            score={rcaParsed.confidence_score}
            onGetAiSuggestion={showAiSuggestion ? handleGetAiSuggestion : undefined}
          />

          <PrimaryRootCauseCard
            primaryCause={primaryRootCause}
            originalPrimaryCause={rcaParsed.primary_root_cause}
            immediateCause={immediateCause}
            originalImmediateCause={rcaParsed.immediate_cause}
            onPrimaryChange={setPrimaryRootCause}
            onImmediateChange={setImmediateCause}
            primarySources={rcaParsed.primary_root_cause_sources}
            immediateSources={rcaParsed.immediate_cause_sources}
          />

          <ListTextareaCard
            title="Contributing Factors"
            label=""
            value={contributingFactors}
            originalValue={(rcaParsed.contributing_factors ?? []).join("\n")}
            onChange={setContributingFactors}
            sources={flattenSources(rcaParsed.contributing_factors_sources)}
          />

          <ListTextareaCard
            title="Supporting Evidence"
            label=""
            value={evidence}
            originalValue={(rcaParsed.evidence ?? []).join("\n")}
            onChange={setEvidence}
            sources={flattenSources(rcaParsed.evidence_sources)}
          />

          <DecisionAction
            acceptLoadingLabel="Generating CAPA..."
            onAccept={handleAccept}
            acceptDisabled={isGeneratingCAPA || !canAccept}
            onDiscard={() => setShowDiscardDialog(true)}
            isLoading={isGeneratingCAPA}
            error={capaError}
            errorTitle="CAPA generation failed"
            warning={emptyFieldsWarning}
            footerText="Your decision will be logged in the audit trail. Accepting generates CAPA recommendations using whatever is currently in the form above."
          />
        </div>

        <DiscardDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          title="Discard Root Cause"
          description="Please provide a reason for discarding this root cause analysis. You will be redirected to the deviation form. This will be recorded in the audit trail."
          subjectLabel="the root cause analysis"
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