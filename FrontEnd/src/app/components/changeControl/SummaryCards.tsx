import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { AlertTriangle, Loader2, Sparkles, User } from "lucide-react";
import { ModifiedBadge } from "../eventIntake";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";

//Helpers
export function getRiskLevelBadgeClass(level: string): string {
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

export function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-muted text-muted-foreground border-border";
}

export function getGxpBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("no impact"))
    return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  if (v.includes("indirect"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  if (v.includes("direct"))
    return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  return "bg-muted text-muted-foreground border border-border";
}

export function getValidationImpactBadgeClass(affected: boolean): string {
  return affected
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

export function getValidationLevelBadgeClass(level: string): string {
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

export const RISK_FIELD_LABELS = {
  patient_safety_product_quality_impact:
    "Patient Safety / Product Quality Impact",
  regulatory_impact: "Regulatory Impact",
  data_integrity_risk: "Data Integrity Risk",
  operational_disruption_risk: "Operational Disruption Risk",
} as const;

// Shared title styling so every card heading across the Summary page
// renders at the same size/weight, regardless of section.
export const CARD_TITLE_CLASS =
  "flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100";

// Shared styling for each field's sub-heading within a consolidated
// section card (label on the left, Modified badge on the right).
const SUBSECTION_HEADER_CLASS =
  "flex items-center gap-2 flex-wrap justify-between mb-3";
const SUBSECTION_LABEL_CLASS =
  "text-sm font-medium text-foreground";

export const ConfidenceBar: React.FC<{ score: number }> = ({ score }) => (
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

// Field-level "Modified" badge — mirrors the deviation Summary page's
// approach of checking each field's provenance source, rather than the
// blanket per-card ModifiedBadge used elsewhere in the change control flow.
export function FieldModifiedBadge<T>({ field }: { field?: { source: string } }) {
  if (!field || field.source !== "modified") return null;
  return <ModifiedBadge />;
}

// Bulleted list used for the read-only, per-stage history cards below.
export const BulletList: React.FC<{ items: string[] }> = ({ items }) => {
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
};

export const NoSummaryDataGuard: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">No summary data found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and complete the Implementation &amp; Control Actions
          step first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

//1. Classification section — single card: badge + confidence + AI rationale
export const ClassificationSummaryCard: React.FC<{
  parsed: any;
  provenance: any;
}> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className={CARD_TITLE_CLASS}>
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
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getClassificationBadgeClass(parsed.classification)}`}
        >
          {parsed.classification}
        </span>
        <FieldModifiedBadge field={provenance?.classification?.classification} />
      </div>

      <ConfidenceBar score={parsed.confidence_score} />

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>AI Rationale</p>
          <FieldModifiedBadge field={provenance?.classification?.rationale} />
        </div>
        <BulletList items={parsed.rationale} />
      </div>
    </CardContent>
  </Card>
);

//2. Change Impact Assessment section — single card, all fields as subsections
export const ChangeImpactSummarySection: React.FC<{
  parsed: any;
  provenance: any;
}> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className={CARD_TITLE_CLASS}>
        <Sparkles className="h-5 w-5 text-blue-600" />
        Change Impact Assessment
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <ConfidenceBar score={parsed.confidence_score} />

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {CHANGE_IMPACT_FIELD_LABELS.impacted_systems}
          </p>
          <FieldModifiedBadge
            field={provenance?.changeImpactAssessment?.impacted_systems}
          />
        </div>
        <BulletList items={parsed.impacted_systems} />
      </div>

      <div className="border-t pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {CHANGE_IMPACT_FIELD_LABELS.gxp_classification}
            </p>
            <FieldModifiedBadge
              field={
                provenance?.changeImpactAssessment?.gxp_classification?.value
              }
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGxpBadgeClass(parsed.gxp_classification.value)}`}
            >
              {parsed.gxp_classification.value}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.gxp_classification.rationale}
            </p>
          </div>
        </div>

        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {CHANGE_IMPACT_FIELD_LABELS.data_validation_impact}
            </p>
            <FieldModifiedBadge
              field={
                provenance?.changeImpactAssessment?.data_validation_impact
                  ?.validated_state_affected
              }
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getValidationImpactBadgeClass(parsed.data_validation_impact.validated_state_affected)}`}
            >
              {parsed.data_validation_impact.validated_state_affected
                ? "Validated State Affected"
                : "Not Affected"}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.data_validation_impact.rationale}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {CHANGE_IMPACT_FIELD_LABELS.downstream_dependencies}
          </p>
          <FieldModifiedBadge
            field={provenance?.changeImpactAssessment?.downstream_dependencies}
          />
        </div>
        <BulletList items={parsed.downstream_dependencies} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {CHANGE_IMPACT_FIELD_LABELS.risk_scoring}
          </p>
          <FieldModifiedBadge
            field={provenance?.changeImpactAssessment?.risk_scoring?.level}
          />
        </div>
        <div className="space-y-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(parsed.risk_scoring.level)}`}
          >
            {parsed.risk_scoring.level} Risk
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {parsed.risk_scoring.rationale}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

//3. Risk & Criticality Evaluation section — single card, all fields as subsections
export const RiskCriticalitySummarySection: React.FC<{
  parsed: any;
  provenance: any;
}> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className={CARD_TITLE_CLASS}>
        <Sparkles className="h-5 w-5 text-blue-600" />
        Risk &amp; Criticality Evaluation
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <ConfidenceBar score={parsed.confidence_score} />

      <div className="border-t pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {RISK_FIELD_LABELS.patient_safety_product_quality_impact}
            </p>
            <FieldModifiedBadge
              field={
                provenance?.riskCriticality
                  ?.patient_safety_product_quality_impact?.level
              }
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(parsed.patient_safety_product_quality_impact.level)}`}
            >
              {parsed.patient_safety_product_quality_impact.level}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.patient_safety_product_quality_impact.rationale}
            </p>
          </div>
        </div>

        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {RISK_FIELD_LABELS.regulatory_impact}
            </p>
            <FieldModifiedBadge
              field={provenance?.riskCriticality?.regulatory_impact?.level}
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(parsed.regulatory_impact.level)}`}
            >
              {parsed.regulatory_impact.level}
            </span>
            {parsed.regulatory_impact.filings_or_submissions_affected?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Filings / Submissions Affected
                </p>
                <BulletList
                  items={parsed.regulatory_impact.filings_or_submissions_affected}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.regulatory_impact.rationale}
            </p>
          </div>
        </div>

        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {RISK_FIELD_LABELS.data_integrity_risk}
            </p>
            <FieldModifiedBadge
              field={provenance?.riskCriticality?.data_integrity_risk?.level}
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(parsed.data_integrity_risk.level)}`}
            >
              {parsed.data_integrity_risk.level}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.data_integrity_risk.rationale}
            </p>
          </div>
        </div>

        <div>
          <div className={SUBSECTION_HEADER_CLASS}>
            <p className={SUBSECTION_LABEL_CLASS}>
              {RISK_FIELD_LABELS.operational_disruption_risk}
            </p>
            <FieldModifiedBadge
              field={
                provenance?.riskCriticality?.operational_disruption_risk
                  ?.level
              }
            />
          </div>
          <div className="space-y-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelBadgeClass(parsed.operational_disruption_risk.level)}`}
            >
              {parsed.operational_disruption_risk.level}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.operational_disruption_risk.rationale}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>Risk Ranking Justification</p>
          <FieldModifiedBadge
            field={provenance?.riskCriticality?.risk_ranking_justification}
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {parsed.risk_ranking_justification}
        </p>
      </div>
    </CardContent>
  </Card>
);

//4. Validation & Testing Strategy section — single card, all fields as subsections
export const ValidationTestingSummarySection: React.FC<{
  parsed: any;
  provenance: any;
}> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className={CARD_TITLE_CLASS}>
        <Sparkles className="h-5 w-5 text-blue-600" />
        Validation &amp; Testing Strategy
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <ConfidenceBar score={parsed.confidence_score} />

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {VALIDATION_TESTING_FIELD_LABELS.required_validation_level}
          </p>
          <FieldModifiedBadge
            field={
              provenance?.validationTesting?.required_validation_level?.level
            }
          />
        </div>
        <div className="space-y-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getValidationLevelBadgeClass(parsed.required_validation_level.level)}`}
          >
            {parsed.required_validation_level.level}
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {parsed.required_validation_level.rationale}
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {VALIDATION_TESTING_FIELD_LABELS.scenario_based_testing}
          </p>
          <FieldModifiedBadge
            field={provenance?.validationTesting?.scenario_based_testing}
          />
        </div>
        <BulletList items={parsed.scenario_based_testing} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {VALIDATION_TESTING_FIELD_LABELS.regression_scope}
          </p>
          <FieldModifiedBadge
            field={provenance?.validationTesting?.regression_scope}
          />
        </div>
        <BulletList items={parsed.regression_scope} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {VALIDATION_TESTING_FIELD_LABELS.uat_requirements}
          </p>
          <FieldModifiedBadge
            field={provenance?.validationTesting?.uat_requirements}
          />
        </div>
        <BulletList items={parsed.uat_requirements} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {VALIDATION_TESTING_FIELD_LABELS.traceability}
          </p>
          <FieldModifiedBadge
            field={provenance?.validationTesting?.traceability}
          />
        </div>
        <BulletList items={parsed.traceability} />
      </div>
    </CardContent>
  </Card>
);

//5. Implementation & Control Actions section — single card, all fields as subsections
export const ImplementationSummarySection: React.FC<{
  parsed: any;
  provenance: any;
}> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className={CARD_TITLE_CLASS}>
        <Sparkles className="h-5 w-5 text-blue-600" />
        Implementation &amp; Control Actions
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <ConfidenceBar score={parsed.confidence_score} />

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {IMPLEMENTATION_CONTROL_FIELD_LABELS.required_actions}
          </p>
          <FieldModifiedBadge
            field={provenance?.implementationControl?.required_actions}
          />
        </div>
        <BulletList items={parsed.required_actions} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {IMPLEMENTATION_CONTROL_FIELD_LABELS.sop_wi_updates}
          </p>
          <FieldModifiedBadge
            field={provenance?.implementationControl?.sop_wi_updates}
          />
        </div>
        <BulletList items={parsed.sop_wi_updates} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {IMPLEMENTATION_CONTROL_FIELD_LABELS.approval_routing}
          </p>
          <FieldModifiedBadge
            field={provenance?.implementationControl?.approval_routing}
          />
        </div>
        <BulletList items={parsed.approval_routing} />
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
          </p>
          <FieldModifiedBadge
            field={provenance?.implementationControl?.implementation_plan}
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {parsed.implementation_plan}
        </p>
      </div>

      <div className="border-t pt-4">
        <div className={SUBSECTION_HEADER_CLASS}>
          <p className={SUBSECTION_LABEL_CLASS}>
            {IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan}
          </p>
          <FieldModifiedBadge
            field={
              provenance?.implementationControl?.rollback_contingency_plan
            }
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {parsed.rollback_contingency_plan}
        </p>
      </div>
    </CardContent>
  </Card>
);

//Save section + dialog
export const SummarySaveSection: React.FC<{
  saveError: string | null;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
}> = ({ saveError, isSaving, isSaved, onSave }) => (
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
        onClick={onSave}
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
);

export const SavedByDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedByName: string;
  setSavedByName: (value: string) => void;
  savedByError: string;
  setSavedByError: (value: string) => void;
  onConfirm: () => void;
}> = ({
  open,
  onOpenChange,
  savedByName,
  setSavedByName,
  savedByError,
  setSavedByError,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" /> Save Record
        </DialogTitle>
      </DialogHeader>
      <div className="py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Please enter your name to record who is saving this change control
          case.
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
              if (e.key === "Enter") onConfirm();
            }}
            autoFocus
          />
          {savedByError && (
            <p className="text-xs text-red-600">{savedByError}</p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={onConfirm}
        >
          Confirm &amp; Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);