import { useNavigate } from "react-router";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
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
import {
  AlertTriangle,
  FlaskConical,
  Link2,
  ListChecks,
  RefreshCcw,
  Users,
} from "lucide-react";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { LlmFailureDialog } from "../../components/LlmFailureDialog";
import { useValidationTestingReview } from "../../hooks/changeControl/useValidationTesting";
import {
  NoValidationDataGuard,
  ValidationConfidenceCard,
  ValidationLevelCard,
  ListTextareaCard,
} from "../../components/changeControl/ValidationTestingCards";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";

export function ValidationTesting() {
  const navigate = useNavigate();
  const {
    result,
    classificationParsed,
    impactParsed,
    riskParsed,
    validationParsed,
    chatOpen,
    setChatOpen,
    level,
    levelRationale,
    scenarioTesting,
    setScenarioTesting,
    regressionScope,
    setRegressionScope,
    uatRequirements,
    setUatRequirements,
    traceability,
    setTraceability,
    updateLevel,
    updateLevelRationale,
    levelChangedWithoutRationale,
    isLevelModified,
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
    showRationaleWarning,
    setShowRationaleWarning,
    isSubmitting,
    submitError,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
    llmFailure,
  } = useValidationTestingReview();

  // Guard
  if (
    !validationParsed ||
    !riskParsed ||
    !impactParsed ||
    !classificationParsed
  ) {
    return (
      <NoValidationDataGuard
        onGoBack={() => navigate("/change-control/risk-criticality")}
      />
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

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overridden"
        />

        <div className="space-y-6 mt-6">
          <ValidationConfidenceCard score={validationParsed.confidence_score} />

          <ValidationLevelCard
            icon={<FlaskConical className="h-4 w-4 text-blue-500" />}
            title={VALIDATION_TESTING_FIELD_LABELS.required_validation_level}
            level={level}
            levelRationale={levelRationale}
            isOverrideEditing={isOverrideEditing}
            isLevelModified={isLevelModified}
            levelChangedWithoutRationale={levelChangedWithoutRationale}
            onLevelChange={updateLevel}
            onRationaleChange={updateLevelRationale}
          />

          <ListTextareaCard
            icon={<ListChecks className="h-4 w-4 text-blue-500" />}
            title={VALIDATION_TESTING_FIELD_LABELS.scenario_based_testing}
            fieldId="scenarioTesting"
            label="One test scenario per line"
            value={scenarioTesting}
            originalValue={validationParsed.scenario_based_testing.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setScenarioTesting}
            placeholder="Describe recommended test scenarios..."
          />

          <ListTextareaCard
            icon={<RefreshCcw className="h-4 w-4 text-blue-500" />}
            title={VALIDATION_TESTING_FIELD_LABELS.regression_scope}
            fieldId="regressionScope"
            label="Existing functionality to retest — one item per line"
            value={regressionScope}
            originalValue={validationParsed.regression_scope.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setRegressionScope}
            placeholder="Describe the regression testing scope..."
          />

          <ListTextareaCard
            icon={<Users className="h-4 w-4 text-blue-500" />}
            title={VALIDATION_TESTING_FIELD_LABELS.uat_requirements}
            fieldId="uatRequirements"
            label="One UAT requirement per line"
            value={uatRequirements}
            originalValue={validationParsed.uat_requirements.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setUatRequirements}
            placeholder="Describe UAT requirements..."
          />

          <ListTextareaCard
            icon={<Link2 className="h-4 w-4 text-blue-500" />}
            title={VALIDATION_TESTING_FIELD_LABELS.traceability}
            fieldId="traceability"
            label="One requirement / procedure link per line"
            value={traceability}
            originalValue={validationParsed.traceability.join("\n")}
            isOverrideEditing={isOverrideEditing}
            overrideConfirmed={overrideConfirmed}
            onChange={setTraceability}
            placeholder="Link to relevant requirements or procedures..."
          />

          {/* Bottom Decision Area */}
          <DecisionAction
            acceptLabel="Accept & Continue to Implementation & Control Actions"
            acceptLoadingLabel="Submitting Strategy..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Strategy"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Strategy"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isSubmitting}
            error={submitError}
            errorTitle="Strategy submission failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding submits this strategy and starts Implementation & Control Actions — it only starts now, not before you decide."
          />
        </div>

        {/* Rationale Warning Dialog */}
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
                You changed the required validation level but have not updated
                the rationale to explain the change.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please update the rationale with the reason for the new value
              before saving.
            </p>
            <DialogFooter>
              <Button
                onClick={() => setShowRationaleWarning(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Back &amp; Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Override Justification Dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Validation & Testing Strategy"
          subjectLabel="the strategy"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isSubmitting}
        />

        {/* Reject Dialog */}
        <RejectDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          title="Reject Validation & Testing Strategy"
          description="Please provide a reason for rejecting this strategy. This will be recorded in the audit trail."
          subjectLabel="the validation & testing strategy"
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
