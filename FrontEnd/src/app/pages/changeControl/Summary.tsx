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
    showSavedByDialog,
    setShowSavedByDialog,
    savedByName,
    setSavedByName,
    savedByError,
    setSavedByError,
    handleSaveClick,
    handleConfirmSave,
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
          isSaving={isSaving}
          isSaved={isSaved}
          onSave={handleSaveClick}
        />

        <SavedByDialog
          open={showSavedByDialog}
          onOpenChange={setShowSavedByDialog}
          savedByName={savedByName}
          setSavedByName={setSavedByName}
          savedByError={savedByError}
          setSavedByError={setSavedByError}
          onConfirm={handleConfirmSave}
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