import { AIAssistant } from "../../components/chat/AiAssistant";
import { StepProgressBar } from "../../components/eventIntake/StepProgressBar";
import { useSummary } from "../../hooks/changeControl/useSummary";
import { SubmitToApproverDialog } from "../../components/approvals/SubmitToApproverDialog";
import {
  NoSummaryDataGuard,
  ClassificationSummaryCard,
  ChangeImpactSummarySection,
  RiskCriticalitySummarySection,
  ValidationTestingSummarySection,
  ImplementationSummarySection,
  SummarySaveSection,
} from "../../components/changeControl/SummaryCards";

export function ChangecontrolSummary() {
  const {
    navigate,
    chatOpen,
    setChatOpen,
    result,
    classificationParsed,
    changeImpactParsed,
    riskParsed,
    validationTestingParsed,
    implementationParsed,
    provenance,
    isSaving,
    isSaved,
    saveError,

    handleSaveClick,
    approverDialogOpen,
    setApproverDialogOpen,
    handleConfirmSubmit,
    submittedBy,
  } = useSummary();

  // Guard: no submission yet
  if (
    !result ||
    !classificationParsed ||
    !changeImpactParsed ||
    !riskParsed ||
    !implementationParsed
  ) {
    return (
      <NoSummaryDataGuard
        onGoBack={() => navigate("/change-control/implementation")}
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
          implementationAccepted={true}
        />

        {/* Full step-by-step pipeline data, mirroring the Deviation Summary page */}
        <div className="space-y-6 mb-6">
          <ClassificationSummaryCard
            parsed={classificationParsed}
            provenance={provenance}
          />

          <ChangeImpactSummarySection
            parsed={changeImpactParsed}
            provenance={provenance}
          />

          {riskParsed && (
            <RiskCriticalitySummarySection
              parsed={riskParsed}
              provenance={provenance}
            />
          )}

          {validationTestingParsed && (
            <ValidationTestingSummarySection
              parsed={validationTestingParsed}
              provenance={provenance}
            />
          )}

          <ImplementationSummarySection
            parsed={implementationParsed}
            provenance={provenance}
          />
        </div>

        <SummarySaveSection
          saveError={saveError}
          isSaving={false}
          isSaved={isSaved || approverDialogOpen}
          onSave={handleSaveClick}
        />

        {/* Submit → collect the "Submitted to" approver name (capital first letter). */}
        <SubmitToApproverDialog
          open={approverDialogOpen}
          onOpenChange={setApproverDialogOpen}
          onConfirm={handleConfirmSubmit}
          submittedBy={submittedBy}
          isSubmitting={isSaving}
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
