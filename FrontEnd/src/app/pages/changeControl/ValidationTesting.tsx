import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import {
  DecisionAction,
  ModifiedBadge,
  ModifiedStatus,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  AlertTriangle,
  FlaskConical,
  Link2,
  ListChecks,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  aiField,
  markModified,
  type ValidationTestingProvenance,
} from "../../types/dataProvenance";
import { AIAssistant } from "../../components/chat/ai-assistant";
import type {
  ImplementationControlApiResponse,
  ValidationLevel,
  ValidationTestingParsed,
} from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";
import { nestedToFlatChangeImpactAssessment } from "../../../utils/changeImpactAdapter";
import {
  flatToNestedImplementationControl,
  nestedToFlatValidationTesting,
} from "../../../utils/changeControlAdapters";

// Helpers — mirrors the list <-> textarea convention used on
// RiskCriticality.tsx / ImplementationControl.tsx
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

// Styling aligned with the sibling RiskCriticality.tsx badges
function getValidationLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "full":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "partial":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "none":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

// Component
export function ValidationTesting() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const validationParsed = result?.stages?.validationTesting?.parsed ?? null;

  // Editable form state, seeded from the AI-generated values
  const [level, setLevel] = useState<ValidationLevel>(
    validationParsed?.required_validation_level.level ?? "None",
  );
  const [levelRationale, setLevelRationale] = useState(
    validationParsed?.required_validation_level.rationale ?? "",
  );
  const [scenarioTesting, setScenarioTesting] = useState(
    linesToText(validationParsed?.scenario_based_testing ?? []),
  );
  const [regressionScope, setRegressionScope] = useState(
    linesToText(validationParsed?.regression_scope ?? []),
  );
  const [uatRequirements, setUatRequirements] = useState(
    linesToText(validationParsed?.uat_requirements ?? []),
  );
  const [traceability, setTraceability] = useState(
    linesToText(validationParsed?.traceability ?? []),
  );

  // "Changed the value but not the rationale" tracking (level field only —
  // the list fields below don't carry a separate rationale sub-field).
  const [levelChangedWithoutRationale, setLevelChangedWithoutRationale] =
    useState(false);

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showRationaleWarning, setShowRationaleWarning] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Re-hydrate local editable state whenever a *new* validation strategy
  // lands in the store (mirrors RiskCriticality.tsx / ImplementationControl.tsx).
  useEffect(() => {
    if (!validationParsed) return;
    setLevel(validationParsed.required_validation_level.level);
    setLevelRationale(validationParsed.required_validation_level.rationale);
    setScenarioTesting(linesToText(validationParsed.scenario_based_testing));
    setRegressionScope(linesToText(validationParsed.regression_scope));
    setUatRequirements(linesToText(validationParsed.uat_requirements));
    setTraceability(linesToText(validationParsed.traceability));
    setLevelChangedWithoutRationale(false);
    setOverrideConfirmed(false);
    setIsOverrideEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationParsed]);

  // Guard
  if (
    !validationParsed ||
    !riskParsed ||
    !impactParsed ||
    !classificationParsed
  ) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No validation &amp; testing strategy data found.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Please go back and complete the Risk &amp; Criticality Evaluation
              first.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/change-control/risk-criticality")}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Field update helpers
  const updateLevel = (value: string) => {
    setLevel(value as ValidationLevel);
    setLevelChangedWithoutRationale(
      value !== validationParsed.required_validation_level.level,
    );
  };
  const updateLevelRationale = (value: string) => {
    setLevelRationale(value);
    if (value !== validationParsed.required_validation_level.rationale) {
      setLevelChangedWithoutRationale(false);
    }
  };

  // Approved validation testing — 1:1 with ValidationTestingParsed
  const buildApprovedValidationTesting = (): ValidationTestingParsed => ({
    ...validationParsed,
    required_validation_level: { level, rationale: levelRationale },
    scenario_based_testing: parseLines(scenarioTesting),
    regression_scope: parseLines(regressionScope),
    uat_requirements: parseLines(uatRequirements),
    traceability: parseLines(traceability),
  });

  const buildValidationProvenance = (
    confirmed: boolean,
  ): ValidationTestingProvenance => {
    const original = validationParsed;

    const levelField =
      confirmed && level !== original.required_validation_level.level
        ? markModified(aiField(original.required_validation_level.level), level)
        : aiField(original.required_validation_level.level);
    const levelRationaleField =
      confirmed &&
      levelRationale !== original.required_validation_level.rationale
        ? markModified(
            aiField(original.required_validation_level.rationale),
            levelRationale,
          )
        : aiField(original.required_validation_level.rationale);

    const currentScenarios = parseLines(scenarioTesting);
    const scenarioField =
      confirmed &&
      JSON.stringify(currentScenarios) !==
        JSON.stringify(original.scenario_based_testing)
        ? markModified(
            aiField(original.scenario_based_testing),
            currentScenarios,
          )
        : aiField(original.scenario_based_testing);

    const currentRegression = parseLines(regressionScope);
    const regressionField =
      confirmed &&
      JSON.stringify(currentRegression) !==
        JSON.stringify(original.regression_scope)
        ? markModified(aiField(original.regression_scope), currentRegression)
        : aiField(original.regression_scope);

    const currentUat = parseLines(uatRequirements);
    const uatField =
      confirmed &&
      JSON.stringify(currentUat) !== JSON.stringify(original.uat_requirements)
        ? markModified(aiField(original.uat_requirements), currentUat)
        : aiField(original.uat_requirements);

    const currentTraceability = parseLines(traceability);
    const traceabilityField =
      confirmed &&
      JSON.stringify(currentTraceability) !==
        JSON.stringify(original.traceability)
        ? markModified(aiField(original.traceability), currentTraceability)
        : aiField(original.traceability);

    return {
      required_validation_level: {
        level: levelField,
        rationale: levelRationaleField,
      },
      scenario_based_testing: scenarioField,
      regression_scope: regressionField,
      uat_requirements: uatField,
      traceability: traceabilityField,
      confidence_score: original.confidence_score,
    };
  };

  const navigateToImplementation = (
    implementationControlStage: ImplementationControlApiResponse["stages"]["implementationControl"],
    validationProvenance: ValidationTestingProvenance,
    approvedValidationTesting: ValidationTestingParsed,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        validationTesting: {
          ...result!.stages.validationTesting!,
          parsed: approvedValidationTesting,
        },
        implementationControl: implementationControlStage,
      },
      provenance: {
        ...result!.provenance,
        validationTesting: validationProvenance,
      },
    });
    navigate("/change-control/implementation");
  };

  const submitValidationTesting = async (
    validationProvenance: ValidationTestingProvenance,
  ) => {
    setSubmitError(null);
    setIsSubmitting(true);
    const approvedValidationTesting = buildApprovedValidationTesting();
    try {
      // Backend expects the flat LLM-schema shape for the upstream approved
      // stages, and returns implementationControl.parsed in that same flat
      // shape — flatten going out, nest coming back in.
      const rawImplementationResult: any = await apiFetch(
        "/api/change-control/implementation-control",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            changeImpactAssessment:
              nestedToFlatChangeImpactAssessment(impactParsed),
            riskCriticality: riskParsed,
            validationTesting: nestedToFlatValidationTesting(
              approvedValidationTesting,
            ),
          }),
        },
      );
      const rawStage = rawImplementationResult?.stages?.implementationControl;
      const implementationControlStage: ImplementationControlApiResponse["stages"]["implementationControl"] =
        rawStage
          ? {
              ...rawStage,
              parsed: rawStage.parsed
                ? flatToNestedImplementationControl(rawStage.parsed)
                : null,
            }
          : undefined;
      navigateToImplementation(
        implementationControlStage,
        validationProvenance,
        approvedValidationTesting,
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the validation & testing strategy. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = () => {
    const validationProvenance = buildValidationProvenance(overrideConfirmed);
    const existingImplementation = result!.stages?.implementationControl;
    if (!overrideConfirmed && existingImplementation?.parsed) {
      navigateToImplementation(
        existingImplementation,
        validationProvenance,
        buildApprovedValidationTesting(),
      );
      return;
    }
    void submitValidationTesting(validationProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    if (levelChangedWithoutRationale) {
      setShowRationaleWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    setIsOverrideEditing(false);
    setLevel(validationParsed.required_validation_level.level);
    setLevelRationale(validationParsed.required_validation_level.rationale);
    setScenarioTesting(linesToText(validationParsed.scenario_based_testing));
    setRegressionScope(linesToText(validationParsed.regression_scope));
    setUatRequirements(linesToText(validationParsed.uat_requirements));
    setTraceability(linesToText(validationParsed.traceability));
    setLevelChangedWithoutRationale(false);
  };

  const handleOverrideConfirm = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  const confidenceScore = validationParsed.confidence_score;

  const isLevelModified =
    overrideConfirmed &&
    (level !== validationParsed.required_validation_level.level ||
      levelRationale !== validationParsed.required_validation_level.rationale);

  // Render
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
          overriddenLabel="Overridden"
        />

        <div className="space-y-6 mt-6">
          {/* Top Banner: Confidence Score */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Overall AI Confidence Score
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Based on Risk &amp; Criticality Evaluation (risk ranking
                justification reviewed)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      confidenceScore >= 80
                        ? "bg-green-500"
                        : confidenceScore >= 60
                          ? "bg-yellow-400"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {confidenceScore}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Required Validation Level */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 justify-between mb-4">
                <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-blue-500" />
                  {VALIDATION_TESTING_FIELD_LABELS.required_validation_level}
                </h3>
                {!isOverrideEditing && isLevelModified && <ModifiedBadge />}
              </div>

              {isOverrideEditing ? (
                <div className="space-y-3">
                  <Select value={level} onValueChange={updateLevel}>
                    <SelectTrigger className="w-full md:w-1/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                  {levelChangedWithoutRationale && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Update rationale
                      below
                    </p>
                  )}
                  <Textarea
                    rows={3}
                    value={levelRationale}
                    onChange={(e) => updateLevelRationale(e.target.value)}
                    placeholder="Explain the reason for this change..."
                    className={`resize-none text-sm ${levelChangedWithoutRationale ? "border-orange-400" : ""}`}
                  />
                </div>
              ) : (
                <div>
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getValidationLevelBadgeClass(level)}`}
                  >
                    {level}
                  </span>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
                    {levelRationale || "No rationale provided."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario-Based Testing Recommendations */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <ListChecks className="h-4 w-4 text-blue-500" />
                {VALIDATION_TESTING_FIELD_LABELS.scenario_based_testing}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="scenarioTesting">
                    One test scenario per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={validationParsed.scenario_based_testing.join(
                        "\n",
                      )}
                      current={scenarioTesting}
                    />
                  )}
                </div>
                <Textarea
                  id="scenarioTesting"
                  rows={4}
                  value={scenarioTesting}
                  onChange={(e) => setScenarioTesting(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                  placeholder="Describe recommended test scenarios..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Regression Scope */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <RefreshCcw className="h-4 w-4 text-blue-500" />
                {VALIDATION_TESTING_FIELD_LABELS.regression_scope}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="regressionScope">
                    Existing functionality to retest — one item per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={validationParsed.regression_scope.join("\n")}
                      current={regressionScope}
                    />
                  )}
                </div>
                <Textarea
                  id="regressionScope"
                  rows={4}
                  value={regressionScope}
                  onChange={(e) => setRegressionScope(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                  placeholder="Describe the regression testing scope..."
                />
              </div>
            </CardContent>
          </Card>

          {/* UAT Requirements */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <Users className="h-4 w-4 text-blue-500" />
                {VALIDATION_TESTING_FIELD_LABELS.uat_requirements}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="uatRequirements">
                    One UAT requirement per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={validationParsed.uat_requirements.join("\n")}
                      current={uatRequirements}
                    />
                  )}
                </div>
                <Textarea
                  id="uatRequirements"
                  rows={4}
                  value={uatRequirements}
                  onChange={(e) => setUatRequirements(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                  placeholder="Describe UAT requirements..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Traceability to Requirements / Procedures */}
          <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                <Link2 className="h-4 w-4 text-blue-500" />
                {VALIDATION_TESTING_FIELD_LABELS.traceability}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label htmlFor="traceability">
                    One requirement / procedure link per line
                  </Label>
                  {!isOverrideEditing && (
                    <ModifiedStatus
                      enabled={overrideConfirmed}
                      original={validationParsed.traceability.join("\n")}
                      current={traceability}
                    />
                  )}
                </div>
                <Textarea
                  id="traceability"
                  rows={4}
                  value={traceability}
                  onChange={(e) => setTraceability(e.target.value)}
                  readOnly={!isOverrideEditing}
                  className={
                    !isOverrideEditing ? "bg-muted cursor-default" : ""
                  }
                  placeholder="Link to relevant requirements or procedures..."
                />
              </div>
            </CardContent>
          </Card>

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
