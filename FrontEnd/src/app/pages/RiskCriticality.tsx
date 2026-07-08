import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import {
  DecisionAction,
  ModifiedBadge,
  OverrideDialog,
  OverrideBar,
  RejectDialog,
  StepProgressBar,
} from "../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  aiField,
  markModified,
  type RiskCriticalityProvenance,
} from "../types/dataProvenance";
import { AIAssistant } from "../components/chat/ai-assistant";
import type {
  RiskLevel,
  RiskCriticalityParsed,
  ValidationTestingApiResponse,
} from "../types/pipeline";
import { useWorkflowStore } from "../store/workflowStore";
import { RISK_CATEGORY_LABELS } from "../mocks/mockRiskCriticality";
import { buildSampleChangeControlResult } from "../mocks/mockChangeControlSample";

// The four risk categories share the same {level, rationale} shape, except
// "regulatory_impact" which also carries a list of affected filings/
// submissions — handled via the optional `filings` fields below.
type RiskCategoryKey =
  | "patient_safety_product_quality_impact"
  | "regulatory_impact"
  | "data_integrity_risk"
  | "operational_disruption_risk";

interface CategoryState {
  key: RiskCategoryKey;
  category: string;
  level: RiskLevel;
  rationale: string;
  originalLevel: RiskLevel;
  originalRationale: string;
  filings?: string[];
  originalFilings?: string[];
  levelChangedWithoutRationale: boolean;
}

//Helpers
function getRiskBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "low":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

function filingsToText(filings: string[]): string {
  return filings.join("\n");
}

function textToFilings(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCategoriesFromParsed(
  riskParsed: RiskCriticalityParsed,
): CategoryState[] {
  return [
    {
      key: "patient_safety_product_quality_impact",
      category: RISK_CATEGORY_LABELS.patient_safety_product_quality_impact,
      level: riskParsed.patient_safety_product_quality_impact.level,
      rationale: riskParsed.patient_safety_product_quality_impact.rationale,
      originalLevel: riskParsed.patient_safety_product_quality_impact.level,
      originalRationale:
        riskParsed.patient_safety_product_quality_impact.rationale,
      levelChangedWithoutRationale: false,
    },
    {
      key: "regulatory_impact",
      category: RISK_CATEGORY_LABELS.regulatory_impact,
      level: riskParsed.regulatory_impact.level,
      rationale: riskParsed.regulatory_impact.rationale,
      originalLevel: riskParsed.regulatory_impact.level,
      originalRationale: riskParsed.regulatory_impact.rationale,
      filings: riskParsed.regulatory_impact.filings_or_submissions_affected,
      originalFilings:
        riskParsed.regulatory_impact.filings_or_submissions_affected,
      levelChangedWithoutRationale: false,
    },
    {
      key: "data_integrity_risk",
      category: RISK_CATEGORY_LABELS.data_integrity_risk,
      level: riskParsed.data_integrity_risk.level,
      rationale: riskParsed.data_integrity_risk.rationale,
      originalLevel: riskParsed.data_integrity_risk.level,
      originalRationale: riskParsed.data_integrity_risk.rationale,
      levelChangedWithoutRationale: false,
    },
    {
      key: "operational_disruption_risk",
      category: RISK_CATEGORY_LABELS.operational_disruption_risk,
      level: riskParsed.operational_disruption_risk.level,
      rationale: riskParsed.operational_disruption_risk.rationale,
      originalLevel: riskParsed.operational_disruption_risk.level,
      originalRationale: riskParsed.operational_disruption_risk.rationale,
      levelChangedWithoutRationale: false,
    },
  ];
}

//Component
export function RiskCriticality() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);
  const setPipelineResult = useWorkflowStore((s) => s.setPipelineResult);

  const impactParsed = result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [categories, setCategories] = useState<CategoryState[]>(() =>
    riskParsed ? buildCategoriesFromParsed(riskParsed) : [],
  );
  const [rankingJustification, setRankingJustification] = useState(
    riskParsed?.risk_ranking_justification ?? "",
  );
  const [originalRankingJustification, setOriginalRankingJustification] =
    useState(riskParsed?.risk_ranking_justification ?? "");
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showRationaleWarning, setShowRationaleWarning] = useState(false);
  const [warningCards, setWarningCards] = useState<string[]>([]);

  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Re-hydrate the editable local state whenever a *new* risk evaluation
  // lands in the store — this covers both the normal navigation flow AND
  // the case where this page is already mounted (e.g. showing the "no data"
  // fallback) and data arrives afterward without a remount, which a
  // one-time useState initializer would otherwise miss and leave blank.
  useEffect(() => {
    if (!riskParsed) return;
    setCategories(buildCategoriesFromParsed(riskParsed));
    setRankingJustification(riskParsed.risk_ranking_justification);
    setOriginalRankingJustification(riskParsed.risk_ranking_justification);
    setOverrideConfirmed(false);
    setIsOverrideEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskParsed]);

  //Guard
  if (!riskParsed || !impactParsed) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No risk &amp; criticality evaluation data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and complete the Change Impact Assessment first.
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                navigate("/change-control/change-impact-assessment")
              }
            >
              Go Back
            </Button>
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => setPipelineResult(buildSampleChangeControlResult())}
              >
                Load Sample Data (Preview)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Field update helpers
  const updateLevel = (index: number, value: string) => {
    setCategories((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], level: value as RiskLevel };
      item.levelChangedWithoutRationale = value !== item.originalLevel;
      updated[index] = item;
      return updated;
    });
  };

  const updateRationale = (index: number, value: string) => {
    setCategories((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], rationale: value };
      if (value !== item.originalRationale) {
        item.levelChangedWithoutRationale = false;
      }
      updated[index] = item;
      return updated;
    });
  };

  const updateFilings = (index: number, text: string) => {
    setCategories((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], filings: textToFilings(text) };
      return updated;
    });
  };

  //Provenance builder
  const buildRiskProvenance = (
    confirmed: boolean,
  ): RiskCriticalityProvenance => {
    const byKey = Object.fromEntries(
      categories.map((c) => [c.key, c]),
    ) as Record<RiskCategoryKey, CategoryState>;

    const buildRating = (key: RiskCategoryKey) => {
      const c = byKey[key];
      const modified =
        confirmed &&
        (c.level !== c.originalLevel || c.rationale !== c.originalRationale);
      return {
        level: modified
          ? markModified(aiField(c.originalLevel), c.level)
          : aiField(c.originalLevel),
        rationale: modified
          ? markModified(aiField(c.originalRationale), c.rationale)
          : aiField(c.originalRationale),
      };
    };

    const reg = byKey.regulatory_impact;
    const regModified =
      confirmed &&
      (reg.level !== reg.originalLevel ||
        reg.rationale !== reg.originalRationale ||
        JSON.stringify(reg.filings) !== JSON.stringify(reg.originalFilings));

    const rankingModified =
      confirmed && rankingJustification !== originalRankingJustification;

    return {
      patient_safety_product_quality_impact: buildRating(
        "patient_safety_product_quality_impact",
      ),
      regulatory_impact: {
        level: regModified
          ? markModified(aiField(reg.originalLevel), reg.level)
          : aiField(reg.originalLevel),
        filings_or_submissions_affected: regModified
          ? markModified(
              aiField(reg.originalFilings ?? []),
              reg.filings ?? [],
            )
          : aiField(reg.originalFilings ?? []),
        rationale: regModified
          ? markModified(aiField(reg.originalRationale), reg.rationale)
          : aiField(reg.originalRationale),
      },
      data_integrity_risk: buildRating("data_integrity_risk"),
      operational_disruption_risk: buildRating("operational_disruption_risk"),
      risk_ranking_justification: rankingModified
        ? markModified(
            aiField(originalRankingJustification),
            rankingJustification,
          )
        : aiField(originalRankingJustification),
      confidence_score: riskParsed.confidence_score,
    };
  };

  //Approved risk criticality builder — reflects any override edits, in the
  //shape the backend's RiskCriticalitySchema expects.
  const buildApprovedRiskCriticality = () => {
    const byKey = Object.fromEntries(
      categories.map((c) => [c.key, c]),
    ) as Record<RiskCategoryKey, CategoryState>;
    const reg = byKey.regulatory_impact;
    return {
      ...riskParsed,
      patient_safety_product_quality_impact: {
        level: byKey.patient_safety_product_quality_impact.level,
        rationale: byKey.patient_safety_product_quality_impact.rationale,
      },
      regulatory_impact: {
        level: reg.level,
        filings_or_submissions_affected: reg.filings ?? [],
        rationale: reg.rationale,
      },
      data_integrity_risk: {
        level: byKey.data_integrity_risk.level,
        rationale: byKey.data_integrity_risk.rationale,
      },
      operational_disruption_risk: {
        level: byKey.operational_disruption_risk.level,
        rationale: byKey.operational_disruption_risk.rationale,
      },
      risk_ranking_justification: rankingJustification,
    };
  };

  //Navigation helpers
  const navigateToValidationTesting = (
    validationTestingStage: NonNullable<
      ValidationTestingApiResponse["stages"]["validationTesting"]
    >,
    riskProvenance: RiskCriticalityProvenance,
    approvedRiskCriticality: ReturnType<typeof buildApprovedRiskCriticality>,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        riskCriticality: {
          ...result!.stages.riskCriticality!,
          parsed: approvedRiskCriticality,
        },
        validationTesting: validationTestingStage,
      },
      provenance: {
        ...result!.provenance,
        riskCriticality: riskProvenance,
      },
    });
    navigate("/change-control/validation-testing");
  };

  const runValidationTesting = async (
    riskProvenance: RiskCriticalityProvenance,
  ) => {
    setValidationError(null);
    setIsRunningValidation(true);
    const approvedRiskCriticality = buildApprovedRiskCriticality();
    try {
      const validationResult: ValidationTestingApiResponse = await apiFetch(
        "/api/change-control/validation-testing",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: result!.query,
            changeImpactAssessment: impactParsed,
            riskCriticality: approvedRiskCriticality,
          }),
        },
      );
      navigateToValidationTesting(
        validationResult.stages.validationTesting!,
        riskProvenance,
        approvedRiskCriticality,
      );
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "Something went wrong running the validation & testing strategy. Please try again.",
      );
    } finally {
      setIsRunningValidation(false);
    }
  };

  const handleAccept = () => {
    const riskProvenance = buildRiskProvenance(overrideConfirmed);
    const existingValidationTesting = result!.stages?.validationTesting;
    if (!overrideConfirmed && existingValidationTesting?.parsed) {
      navigateToValidationTesting(
        existingValidationTesting,
        riskProvenance,
        buildApprovedRiskCriticality(),
      );
      return;
    }
    void runValidationTesting(riskProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsRationale = categories
      .filter((c) => c.levelChangedWithoutRationale)
      .map((c) => c.category);

    if (needsRationale.length > 0) {
      setWarningCards(needsRationale);
      setShowRationaleWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    setIsOverrideEditing(false);
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        level: c.originalLevel,
        rationale: c.originalRationale,
        filings: c.originalFilings,
        levelChangedWithoutRationale: false,
      })),
    );
    setRankingJustification(originalRankingJustification);
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
      navigate("/change-control/change-impact-assessment");
    }
  };

  const confidenceScore = riskParsed.confidence_score;
  const isRankingModified =
    overrideConfirmed && rankingJustification !== originalRankingJustification;

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Risk &amp; Criticality Evaluation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Patient safety, regulatory, data integrity, and operational
            disruption risk for this change.
          </p>
        </div>

        <OverrideBar
          isOverrideEditing={isOverrideEditing}
          overrideConfirmed={overrideConfirmed}
          onCancelOverride={handleCancelOverride}
          overriddenLabel="Overriden"
        />

        <div className="space-y-6">
          {/* Confidence */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Overall AI Confidence Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Based on Change Impact Assessment (risk scoring:{" "}
                  {impactParsed.risk_scoring})
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {confidenceScore}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${confidenceScore >= 80 ? "bg-green-500" : confidenceScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 4 Risk category cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map((cat, index) => {
              const isLevelModified =
                overrideConfirmed && cat.level !== cat.originalLevel;
              const isRationaleModified =
                overrideConfirmed && cat.rationale !== cat.originalRationale;
              const isFilingsModified =
                overrideConfirmed &&
                JSON.stringify(cat.filings) !==
                  JSON.stringify(cat.originalFilings);
              const isAnyModified =
                isLevelModified || isRationaleModified || isFilingsModified;

              return (
                <Card
                  key={cat.key}
                  className={`shadow-sm ${cat.levelChangedWithoutRationale && isOverrideEditing ? "ring-2 ring-orange-400" : ""}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {cat.category}
                      {!isOverrideEditing && isAnyModified && <ModifiedBadge />}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isOverrideEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Risk Level
                          </label>
                          <Select
                            value={cat.level}
                            onValueChange={(value) =>
                              updateLevel(index, value)
                            }
                          >
                            <SelectTrigger
                              className={getRiskBadgeClass(cat.level)}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">🔴 High</SelectItem>
                              <SelectItem value="Moderate">
                                🟡 Moderate
                              </SelectItem>
                              <SelectItem value="Low">🟢 Low</SelectItem>
                            </SelectContent>
                          </Select>
                          {cat.levelChangedWithoutRationale && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Please update the rationale below to explain
                              this change.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Rationale
                            {cat.levelChangedWithoutRationale && (
                              <span className="text-orange-600 ml-1">*</span>
                            )}
                          </label>
                          <Textarea
                            rows={4}
                            value={cat.rationale}
                            onChange={(e) =>
                              updateRationale(index, e.target.value)
                            }
                            placeholder="Explain the reason for this risk level..."
                            className={
                              cat.levelChangedWithoutRationale
                                ? "border-orange-400 focus:ring-orange-400"
                                : ""
                            }
                          />
                        </div>

                        {cat.key === "regulatory_impact" && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Filings / Submissions Affected
                            </label>
                            <Textarea
                              rows={3}
                              value={filingsToText(cat.filings ?? [])}
                              onChange={(e) =>
                                updateFilings(index, e.target.value)
                              }
                              placeholder="One filing or submission per line..."
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              One per line
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeClass(cat.level)}`}
                          >
                            {cat.level}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {cat.rationale}
                        </p>

                        {cat.key === "regulatory_impact" && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                              Filings / Submissions Affected
                            </p>
                            {cat.filings && cat.filings.length > 0 ? (
                              <ul className="space-y-1.5">
                                {cat.filings.map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-muted-foreground"
                                  >
                                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                None identified
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Risk ranking + justification */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-blue-600" />
                  Risk Ranking &amp; Justification
                </span>
                {!isOverrideEditing && isRankingModified && <ModifiedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isOverrideEditing ? (
                <Textarea
                  rows={4}
                  value={rankingJustification}
                  onChange={(e) => setRankingJustification(e.target.value)}
                  placeholder="Explain the overall risk ranking for this change..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rankingJustification}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Decision Required */}
          <DecisionAction
            acceptLabel="Accept & Continue to Validation & Testing Strategy"
            acceptLoadingLabel="Generating Validation & Testing Strategy..."
            onAccept={handleAccept}
            isOverrideEditing={isOverrideEditing}
            overrideLabel="Override Evaluation"
            onOverrideClick={handleOverrideClick}
            onSaveChanges={handleSaveChanges}
            rejectLabel="Reject Evaluation"
            onReject={() => setShowRejectDialog(true)}
            isLoading={isRunningValidation}
            error={validationError}
            errorTitle="Validation & testing strategy generation failed"
            footerText="Your decision will be logged in the audit trail. Accepting or overriding runs the validation & testing strategy — it only starts now, not before you decide."
          />
        </div>

        {/* Rationale required warning dialog */}
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
                You changed the risk level for the following{" "}
                {warningCards.length === 1 ? "category" : "categories"} but
                have not updated the rationale to explain the change:
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-2 space-y-1">
              {warningCards.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Please update the rationale for each changed category with the
              reason for the new risk level before saving.
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

        {/* Override justification dialog */}
        <OverrideDialog
          open={showOverrideDialog}
          onOpenChange={setShowOverrideDialog}
          title="Override Risk & Criticality Evaluation"
          subjectLabel="the evaluation"
          value={overrideJustification}
          onChange={setOverrideJustification}
          onCancel={() => setShowOverrideDialog(false)}
          onConfirm={handleOverrideConfirm}
          isLoading={isRunningValidation}
        />

        {/* Reject dialog */}
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