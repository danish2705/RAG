import { useMemo } from "react";
import {
  DecisionAction,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { AIAssistant } from "../../components/chat/AiAssistant";
import {
  useRiskCriticality,
  RISK_FIELD_LABELS,
} from "../../hooks/changeControl/useRiskCriticality";
import {
  NoRiskCriticalityDataGuard,
  RiskConfidenceCard,
  RiskLevelCard,
  RegulatoryFilingsEditor,
  RegulatoryFilingsList,
  RiskRankingCard,
} from "../../components/changeControl/RiskCriticalityCards";

export function RiskCriticality() {
  const {
    navigate,
    chatOpen,
    setChatOpen,
    result,
    classificationParsed,
    impactParsed,
    riskParsed,
    psLevel,
    psRationale,
    regLevel,
    regFilings,
    setRegFilings,
    regRationale,
    diLevel,
    diRationale,
    odLevel,
    odRationale,
    rankingJustification,
    setRankingJustification,
    updatePsLevel,
    updatePsRationale,
    updateRegLevel,
    updateRegRationale,
    updateDiLevel,
    updateDiRationale,
    updateOdLevel,
    updateOdRationale,
    psChangedWithoutRationale,
    regChangedWithoutRationale,
    diChangedWithoutRationale,
    odChangedWithoutRationale,
    isPsModified,
    isRegModified,
    isDiModified,
    isOdModified,
    isRankingModified,
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
    warningFields,
    isSubmitting,
    submitError,
    confidenceScore,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  } = useRiskCriticality();

  // Stabilized so RiskLevelCard (React.memo) doesn't see a "new" prop and
  // re-render on every keystroke elsewhere on the page — only when
  // regFilings/setRegFilings actually change does this recompute.
  const regulatoryFilingsEditorEl = useMemo(
    () => (
      <RegulatoryFilingsEditor filings={regFilings} onChange={setRegFilings} />
    ),
    [regFilings, setRegFilings],
  );
  const regulatoryFilingsListEl = useMemo(
    () => <RegulatoryFilingsList filings={regFilings} />,
    [regFilings],
  );

  // Guard
  if (!riskParsed || !impactParsed || !classificationParsed) {
    return (
      <NoRiskCriticalityDataGuard
        onGoBack={() => navigate("/change-control/change-impact-assessment")}
      />
    );
  }

  return (
    <div className="relative h-full w-full bg-gray-50/50 dark:bg-background">
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
          overriddenLabel="Overriden"
        />

        <div className="space-y-6 mt-6">
          {/* Top Banner: Confidence Score */}
          <RiskConfidenceCard
            score={confidenceScore}
            impactRiskLevel={impactParsed.risk_scoring.level}
          />

          {/* Grid Container for the 4 risk category fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Patient Safety / Product Quality Impact */}
            <RiskLevelCard
              title={RISK_FIELD_LABELS.patient_safety_product_quality_impact}
              level={psLevel}
              rationale={psRationale}
              isOverrideEditing={isOverrideEditing}
              isModified={isPsModified}
              changedWithoutRationale={psChangedWithoutRationale}
              onLevelChange={updatePsLevel}
              onRationaleChange={updatePsRationale}
            />

            {/* 2. Regulatory Impact */}
            <RiskLevelCard
              title={RISK_FIELD_LABELS.regulatory_impact}
              level={regLevel}
              rationale={regRationale}
              isOverrideEditing={isOverrideEditing}
              isModified={isRegModified}
              changedWithoutRationale={regChangedWithoutRationale}
              onLevelChange={updateRegLevel}
              onRationaleChange={updateRegRationale}
              badgeSuffix="regulatory risk"
              extraEditor={regulatoryFilingsEditorEl}
              extraReadOnly={regulatoryFilingsListEl}
            />

            {/* 3. Data Integrity Risk */}
            <RiskLevelCard
              title={RISK_FIELD_LABELS.data_integrity_risk}
              level={diLevel}
              rationale={diRationale}
              isOverrideEditing={isOverrideEditing}
              isModified={isDiModified}
              changedWithoutRationale={diChangedWithoutRationale}
              onLevelChange={updateDiLevel}
              onRationaleChange={updateDiRationale}
            />

            {/* 4. Operational Disruption Risk */}
            <RiskLevelCard
              title={RISK_FIELD_LABELS.operational_disruption_risk}
              level={odLevel}
              rationale={odRationale}
              isOverrideEditing={isOverrideEditing}
              isModified={isOdModified}
              changedWithoutRationale={odChangedWithoutRationale}
              onLevelChange={updateOdLevel}
              onRationaleChange={updateOdRationale}
            />

            {/* 5. Risk Ranking & Justification (spans full width) */}
            <RiskRankingCard
              rankingJustification={rankingJustification}
              isOverrideEditing={isOverrideEditing}
              isModified={isRankingModified}
              onChange={setRankingJustification}
            />
          </div>

          {/* Bottom Decision Area */}
          <DecisionAction
            acceptLabel="Accept & Continue to Validation & Testing Strategy"
            acceptLoadingLabel="Submitting Evaluation..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Evaluation"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Evaluation"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isSubmitting}
            error={submitError}
            errorTitle="Evaluation submission failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding submits this evaluation and starts the Validation & Testing strategy — it only starts now, not before you decide."
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Please update the rationale for each changed field with the reason
              for the new value before saving.
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
          title="Override Risk & Criticality Evaluation"
          subjectLabel="the evaluation"
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
          title="Reject Risk & Criticality Evaluation"
          description="Please provide a reason for rejecting this evaluation. This will be recorded in the audit trail."
          subjectLabel="the risk & criticality evaluation"
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
