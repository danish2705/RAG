import { useNavigate } from "react-router";
import {
  DecisionAction,
  DiscardDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { AlertTriangle } from "lucide-react";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { LlmFailureDialog } from "../../components/LlmFailureDialog";
import { useChangeImpactAssessmentReview } from "../../hooks/changeControl/useChangeImpactAssessment";
import {
  NoImpactAssessmentDataGuard,
  ImpactConfidenceCard,
  GxpClassificationCard,
  DataValidationImpactCard,
  ImpactListCard,
  RiskScoringCard,
} from "../../components/changeControl/ChangeImpactAssessmentCards";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";

export function ChangeImpactAssessment() {
  const navigate = useNavigate();
  const {
    result,
    classificationParsed,
    changeImpactParsed,
    chatOpen,
    setChatOpen,
    impactedSystems,
    setImpactedSystems,
    downstreamDependencies,
    setDownstreamDependencies,
    gxpValue,
    gxpRationale,
    validatedStateAffected,
    dataValidationRationale,
    riskLevel,
    riskRationale,
    updateGxpValue,
    updateGxpRationale,
    updateValidatedStateAffected,
    updateDataValidationRationale,
    updateRiskLevel,
    updateRiskRationale,
    gxpChangedWithoutRationale,
    validationChangedWithoutRationale,
    riskChangedWithoutRationale,
    isGxpModified,
    isValidationModified,
    isRiskModified,
    isSystemsModified,
    isDependenciesModified,
    showDiscardDialog,
    setShowDiscardDialog,
    discardJustification,
    setDiscardJustification,
    showRationaleWarning,
    setShowRationaleWarning,
    warningFields,
    isSubmitting,
    submitError,
    handleAccept,
    handleDiscard,
    handleGetAiSuggestion,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    llmFailure,
  } = useChangeImpactAssessmentReview();

  // Guard
  if (!changeImpactParsed || !classificationParsed) {
    return (
      <NoImpactAssessmentDataGuard onGoBack={() => navigate("/deviation")} />
    );
  }

  return (
    <div className="relative h-full w-full bg-gray-50/50 dark:bg-background">
      <LlmFailureDialog control={llmFailure} />
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
        />

        <div className="space-y-6 mt-6">
          <ImpactConfidenceCard
            score={changeImpactParsed.confidence_score}
            onGetAiSuggestion={showAiSuggestion ? handleGetAiSuggestion : undefined}
            sources={result?.stages?.changeImpactAssessment?.sources}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GxpClassificationCard
              title={CHANGE_IMPACT_FIELD_LABELS.gxp_classification}
              value={gxpValue}
              rationale={gxpRationale}
              isModified={isGxpModified}
              changedWithoutRationale={gxpChangedWithoutRationale}
              onValueChange={updateGxpValue}
              onRationaleChange={updateGxpRationale}
            />

            <DataValidationImpactCard
              title={CHANGE_IMPACT_FIELD_LABELS.data_validation_impact}
              validatedStateAffected={validatedStateAffected}
              rationale={dataValidationRationale}
              isModified={isValidationModified}
              changedWithoutRationale={validationChangedWithoutRationale}
              onValueChange={updateValidatedStateAffected}
              onRationaleChange={updateDataValidationRationale}
            />

            <ImpactListCard
              title={CHANGE_IMPACT_FIELD_LABELS.impacted_systems}
              items={impactedSystems}
              isModified={isSystemsModified}
              onChange={setImpactedSystems}
              placeholder="One system / process / study per line..."
            />

            <ImpactListCard
              title={CHANGE_IMPACT_FIELD_LABELS.downstream_dependencies}
              items={downstreamDependencies}
              isModified={isDependenciesModified}
              onChange={setDownstreamDependencies}
              placeholder="One dependency per line..."
            />

            <RiskScoringCard
              title={CHANGE_IMPACT_FIELD_LABELS.risk_scoring}
              level={riskLevel}
              rationale={riskRationale}
              isModified={isRiskModified}
              changedWithoutRationale={riskChangedWithoutRationale}
              onLevelChange={updateRiskLevel}
              onRationaleChange={updateRiskRationale}
            />
          </div>

          {/* Bottom Decision Area */}
          <DecisionAction
            acceptLoadingLabel="Submitting Assessment..."
            onAccept={handleAccept}
            acceptDisabled={isSubmitting || !canAccept}
            onDiscard={() => setShowDiscardDialog(true)}
            isLoading={isSubmitting}
            error={submitError}
            errorTitle="Assessment submission failed"
            warning={emptyFieldsWarning}
            footerText="Your decision will be logged in the audit trail. Accepting submits this assessment and starts the Risk & Criticality evaluation using whatever is currently in the form above."
          />
        </div>

        {/* Warning Dialog */}
        <Dialog
          open={showRationaleWarning}
          onOpenChange={setShowRationaleWarning}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Rationale Update Required
              </DialogTitle>
              <DialogDescription>
                You changed the value for the following{" "}
                {warningFields.length === 1 ? "field" : "fields"} but have not
                updated the rationale to explain the change:
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 space-y-1">
              {warningFields.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Please update the rationale for each changed field with the reason
              for the new value before accepting.
            </p>
            <DialogFooter>
              <Button
                onClick={() => setShowRationaleWarning(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Back & Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Discard Dialog */}
        <DiscardDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          title="Discard Change Impact Assessment"
          description="Please provide a reason for discarding this assessment. This will be recorded in the audit trail."
          subjectLabel="the change impact assessment"
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