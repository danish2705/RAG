import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import { ModifiedBadge } from "../../components/eventIntake";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { AlertTriangle, Loader2, Sparkles, User } from "lucide-react";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useWorkflowStore } from "../../store/workflowStore";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";

//Helpers
function getRiskLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "low":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-muted text-muted-foreground border-border";
}

function getGxpBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("no impact"))
    return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  if (v.includes("indirect"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  if (v.includes("direct"))
    return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  return "bg-muted text-muted-foreground border border-border";
}

function getValidationImpactBadgeClass(affected: boolean): string {
  return affected
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

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

// Field-level "Modified" badge — mirrors the deviation Summary page's
// approach of checking each field's provenance source, rather than the
// blanket per-card ModifiedBadge used elsewhere in the change control flow.
function FieldModifiedBadge<T>({ field }: { field?: { source: string } }) {
  if (!field || field.source !== "modified") return null;
  return <ModifiedBadge />;
}

// Bulleted list used for the read-only, per-stage history cards below.
function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
        None
      </span>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((point, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          {point}
        </li>
      ))}
    </ul>
  );
}

const RISK_FIELD_LABELS = {
  patient_safety_product_quality_impact:
    "Patient Safety / Product Quality Impact",
  regulatory_impact: "Regulatory Impact",
  data_integrity_risk: "Data Integrity Risk",
  operational_disruption_risk: "Operational Disruption Risk",
} as const;

//Component
export function ChangecontrolSummary() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  //Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const changeImpactParsed =
    result?.stages?.changeImpactAssessment?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const validationTestingParsed =
    result?.stages?.validationTesting?.parsed ?? null;
  const implementationParsed =
    result?.stages?.implementationControl?.parsed ?? null;
  const provenance = result?.provenance;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavedByDialog, setShowSavedByDialog] = useState(false);
  const [savedByName, setSavedByName] = useState("");
  const [savedByError, setSavedByError] = useState("");

  //Guard: no submission yet
  if (
    !result ||
    !classificationParsed ||
    !changeImpactParsed ||
    !riskParsed ||
    !implementationParsed
  ) {
    return (
      <div className="p-6 w-full">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No summary data found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please go back and complete the Implementation &amp; Control
              Actions step first.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate("/change-control/implementation")}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  //Save handlers
  const handleSaveClick = () => {
    setSavedByName("");
    setSavedByError("");
    setShowSavedByDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!savedByName.trim()) {
      setSavedByError("Please enter your name before saving.");
      return;
    }
    setSavedByError("");
    setShowSavedByDialog(false);
    setSaveError(null);
    setIsSaving(true);

    try {
      await apiFetch("/api/change-control/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          classification: classificationParsed,
          change_impact_assessment: changeImpactParsed,
          risk_criticality: riskParsed,
          validation_testing: validationTestingParsed,
          implementation_control: implementationParsed,
          final_summary: null,
          status: result.status,
          halted_at: result.haltedAt,
          saved_by: savedByName.trim(),
          provenance: provenance ?? null,
        }),
      });

      setIsSaved(true);
      setTimeout(() => {
        clearWorkflow();
        navigate("/records");
      }, 800);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving the record. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  //Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        {/* Full step-by-step pipeline data, mirroring the Deviation Summary page */}
        <div className="space-y-6 mb-6">
          {/* 1. Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">
                  Classification:
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getClassificationBadgeClass(classificationParsed.classification)}`}
                >
                  {classificationParsed.classification}
                </span>
                <FieldModifiedBadge
                  field={provenance?.classification?.classification}
                />
              </div>

              <ConfidenceBar score={classificationParsed.confidence_score} />

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    AI Rationale
                  </p>
                  <FieldModifiedBadge
                    field={provenance?.classification?.rationale}
                  />
                </div>
                <BulletList items={classificationParsed.rationale} />
              </div>
            </CardContent>
          </Card>

          {/* 2. Change Impact Assessment */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Change Impact Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={changeImpactParsed.confidence_score} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_IMPACT_FIELD_LABELS.impacted_systems}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={provenance?.changeImpactAssessment?.impacted_systems}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={changeImpactParsed.impacted_systems} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {CHANGE_IMPACT_FIELD_LABELS.gxp_classification}
                  <FieldModifiedBadge
                    field={
                      provenance?.changeImpactAssessment?.gxp_classification
                        ?.value
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGxpBadgeClass(changeImpactParsed.gxp_classification.value)}`}
                >
                  {changeImpactParsed.gxp_classification.value}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {changeImpactParsed.gxp_classification.rationale}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {CHANGE_IMPACT_FIELD_LABELS.data_validation_impact}
                  <FieldModifiedBadge
                    field={
                      provenance?.changeImpactAssessment?.data_validation_impact
                        ?.validated_state_affected
                    }
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getValidationImpactBadgeClass(changeImpactParsed.data_validation_impact.validated_state_affected)}`}
                >
                  {changeImpactParsed.data_validation_impact
                    .validated_state_affected
                    ? "Validated State Affected"
                    : "Not Affected"}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {changeImpactParsed.data_validation_impact.rationale}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_IMPACT_FIELD_LABELS.downstream_dependencies}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={
                    provenance?.changeImpactAssessment?.downstream_dependencies
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={changeImpactParsed.downstream_dependencies} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CHANGE_IMPACT_FIELD_LABELS.risk_scoring}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={
                    provenance?.changeImpactAssessment?.risk_scoring?.level
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(changeImpactParsed.risk_scoring.level)}`}
              >
                {changeImpactParsed.risk_scoring.level} Risk
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {changeImpactParsed.risk_scoring.rationale}
              </p>
            </CardContent>
          </Card>

          {/* 3. Risk & Criticality Evaluation */}
          {riskParsed && (
            <>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Risk &amp; Criticality Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={riskParsed.confidence_score} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {RISK_FIELD_LABELS.patient_safety_product_quality_impact}
                      <FieldModifiedBadge
                        field={
                          provenance?.riskCriticality
                            ?.patient_safety_product_quality_impact?.level
                        }
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(riskParsed.patient_safety_product_quality_impact.level)}`}
                    >
                      {riskParsed.patient_safety_product_quality_impact.level}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {
                        riskParsed.patient_safety_product_quality_impact
                          .rationale
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {RISK_FIELD_LABELS.regulatory_impact}
                      <FieldModifiedBadge
                        field={
                          provenance?.riskCriticality?.regulatory_impact?.level
                        }
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(riskParsed.regulatory_impact.level)}`}
                    >
                      {riskParsed.regulatory_impact.level}
                    </span>
                    <BulletList
                      items={
                        riskParsed.regulatory_impact
                          .filings_or_submissions_affected
                      }
                    />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {riskParsed.regulatory_impact.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {RISK_FIELD_LABELS.data_integrity_risk}
                      <FieldModifiedBadge
                        field={
                          provenance?.riskCriticality?.data_integrity_risk
                            ?.level
                        }
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(riskParsed.data_integrity_risk.level)}`}
                    >
                      {riskParsed.data_integrity_risk.level}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {riskParsed.data_integrity_risk.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {RISK_FIELD_LABELS.operational_disruption_risk}
                      <FieldModifiedBadge
                        field={
                          provenance?.riskCriticality
                            ?.operational_disruption_risk?.level
                        }
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(riskParsed.operational_disruption_risk.level)}`}
                    >
                      {riskParsed.operational_disruption_risk.level}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {riskParsed.operational_disruption_risk.rationale}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Risk Ranking Justification
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={
                        provenance?.riskCriticality?.risk_ranking_justification
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                    {riskParsed.risk_ranking_justification}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* 4. Validation & Testing Strategy */}
          {validationTestingParsed && (
            <>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Validation &amp; Testing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar
                    score={validationTestingParsed.confidence_score}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {VALIDATION_TESTING_FIELD_LABELS.required_validation_level}
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={
                        provenance?.validationTesting?.required_validation_level
                          ?.level
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getValidationLevelBadgeClass(validationTestingParsed.required_validation_level.level)}`}
                  >
                    {validationTestingParsed.required_validation_level.level}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {
                      validationTestingParsed.required_validation_level
                        .rationale
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {VALIDATION_TESTING_FIELD_LABELS.scenario_based_testing}
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={
                        provenance?.validationTesting?.scenario_based_testing
                      }
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList
                    items={validationTestingParsed.scenario_based_testing}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {VALIDATION_TESTING_FIELD_LABELS.regression_scope}
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={provenance?.validationTesting?.regression_scope}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList
                    items={validationTestingParsed.regression_scope}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {VALIDATION_TESTING_FIELD_LABELS.uat_requirements}
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={provenance?.validationTesting?.uat_requirements}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList
                    items={validationTestingParsed.uat_requirements}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {VALIDATION_TESTING_FIELD_LABELS.traceability}
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <FieldModifiedBadge
                      field={provenance?.validationTesting?.traceability}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={validationTestingParsed.traceability} />
                </CardContent>
              </Card>
            </>
          )}

          {/* 5. Implementation & Control Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Implementation &amp; Control Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={implementationParsed.confidence_score} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.required_actions}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={provenance?.implementationControl?.required_actions}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={implementationParsed.required_actions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.sop_wi_updates}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={provenance?.implementationControl?.sop_wi_updates}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={implementationParsed.sop_wi_updates} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.approval_routing}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={provenance?.implementationControl?.approval_routing}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={implementationParsed.approval_routing} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={provenance?.implementationControl?.implementation_plan}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                {implementationParsed.implementation_plan}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan}
                <Sparkles className="h-5 w-5 text-blue-600" />
                <FieldModifiedBadge
                  field={
                    provenance?.implementationControl?.rollback_contingency_plan
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                {implementationParsed.rollback_contingency_plan}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Save */}
        <div className="pt-1 pb-1">
          {saveError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Save failed</p>
                <p className="mt-1">{saveError}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pr-10">
            <Button
              onClick={handleSaveClick}
              disabled={isSaving || isSaved}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>

        {/* Saved By Dialog */}
        <Dialog open={showSavedByDialog} onOpenChange={setShowSavedByDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Save Record
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Please enter your name to record who is saving this change
                control case.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="saved-by">Saved By</Label>
                <Input
                  id="saved-by"
                  placeholder="Enter your full name"
                  value={savedByName}
                  onChange={(e) => {
                    setSavedByName(e.target.value);
                    if (savedByError) setSavedByError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmSave();
                  }}
                  autoFocus
                />
                {savedByError && (
                  <p className="text-xs text-red-600">{savedByError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSavedByDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleConfirmSave}
              >
                Confirm &amp; Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
