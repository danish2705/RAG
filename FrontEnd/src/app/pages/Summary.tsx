import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../mocks/api";
import { StepProgressBar } from "../components/qms/StepProgressBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import type { DataField } from "../types/dataProvenance";
import { AIAssistant } from "../components/chat/ai-assistant";
import { useWorkflowStore } from "../store/workflowStore";

// Helpers
function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (type === "Hybrid")
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
  return "bg-muted text-muted-foreground border-border";
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "major":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "minor":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border border-border";
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

const PARAMETER_LABELS: Record<string, string> = {
  product_impact: "Product Impact",
  patient_impact: "Patient Impact",
  data_integrity_impact: "Data Integrity Impact",
  compliance_impact: "Compliance Impact",
};

function ModifiedBadge<T>({
  field,
}: {
  field?: DataField<T>;
  renderValue?: (v: T) => string;
}) {
  if (!field || field.source !== "modified") return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 select-none w-fit">
      <Sparkles className="h-3 w-3" /> Modified
    </span>
  );
}

export function Summary() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store and clear on save
  const result = useWorkflowStore((s) => s.pipelineResult);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;
  const rcaParsed = result?.stages?.rca?.parsed ?? null;
  const capaParsed = result?.stages?.capa?.parsed ?? null;
  const provenance = result?.provenance;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSavedByDialog, setShowSavedByDialog] = useState(false);
  const [savedByName, setSavedByName] = useState("");
  const [savedByError, setSavedByError] = useState("");

  // Guard
  if (
    !result ||
    !classificationParsed ||
    !impactParsed ||
    !rcaParsed ||
    !capaParsed
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
              Please go back and complete the CAPA step first.
            </p>
            <Button className="mt-4" onClick={() => navigate("/deviation")}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const impactEntries = Object.entries(impactParsed.impact_assessment).map(
    ([key, val]) => ({
      key,
      category: PARAMETER_LABELS[key] ?? key,
      severity: val.severity,
      description: val.rationale,
    }),
  );

  // Save handlers

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
      await apiFetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: result.query,
          classification: result.stages?.classification?.parsed ?? null,
          impact_assessment: result.stages?.impactAssessment?.parsed ?? null,
          rca: result.stages?.rca?.parsed ?? null,
          capa: result.stages?.capa?.parsed ?? null,
          status: result.status,
          halted_at: result.haltedAt,
          saved_by: savedByName.trim(),
          provenance: provenance ?? null,
        }),
      });

      setIsSaved(true);
      setTimeout(() => {
        clearWorkflow();
        navigate("/db-log");
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

  // Render
  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={
            result?.stages?.classification?.parsed?.classification
          }
          capaAccepted={true}
        />

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
                Please enter your name to record who is saving this deviation
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
                Confirm & Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2"
            onClick={() => navigate("/deviation/capa")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Summary</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review the complete record before saving
            </p>
          </div>
          {isSaved && (
            <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Saved — redirecting…
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {/* 1. Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Classification <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">
                  Classification:
                </span>
                <Badge
                  className={getClassificationBadgeClass(
                    classificationParsed.classification,
                  )}
                >
                  {classificationParsed.classification}
                </Badge>
                <ModifiedBadge
                  field={provenance?.classification?.classification}
                />
              </div>

              <ConfidenceBar score={classificationParsed.confidence_score} />

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    AI Rationale
                  </p>
                  <ModifiedBadge
                    field={provenance?.classification?.rationale}
                  />
                </div>
                <ul className="space-y-2">
                  {classificationParsed.rationale.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 2. Impact Assessment */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Impact Assessment — Overall Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={impactParsed.confidence_score} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {impactEntries.map((entry) => {
              const impProv = provenance?.impactAssessment?.impact_assessment;
              const keyProv = impProv?.[entry.key as keyof typeof impProv];
              const sevField = keyProv?.severity;
              const ratField = keyProv?.rationale;

              return (
                <Card key={entry.key} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      {entry.category}
                      {(sevField?.source === "modified" ||
                        ratField?.source === "modified") && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 select-none">
                          <Sparkles className="h-3 w-3" /> Modified
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(entry.severity)}`}
                      >
                        {entry.severity}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 3. Root Cause Analysis */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Root Cause Analysis — Overall Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={rcaParsed.confidence_score} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Primary Root Cause{" "}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    Underlying Root Cause
                  </p>
                  <ModifiedBadge field={provenance?.rca?.primary_root_cause} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {rcaParsed.primary_root_cause}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    Immediate Cause (direct trigger)
                  </p>
                  <ModifiedBadge field={provenance?.rca?.immediate_cause} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {rcaParsed.immediate_cause}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Contributing Factors{" "}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ModifiedBadge field={provenance?.rca?.contributing_factors} />
              <ul className="space-y-2">
                {rcaParsed.contributing_factors.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Supporting Evidence{" "}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ModifiedBadge field={provenance?.rca?.evidence} />
              <ul className="space-y-2">
                {rcaParsed.evidence.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 4. CAPA */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                CAPA — Overall Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={capaParsed.confidence_score} />
            </CardContent>
          </Card>

          {result.correction && (
            <Card>
              <CardHeader>
                <CardTitle>Correction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {result.correction}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Corrective Action <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ModifiedBadge field={provenance?.capa?.corrective_actions} />
              <ul className="space-y-2">
                {capaParsed.corrective_actions.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Preventive Action <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ModifiedBadge field={provenance?.capa?.preventive_actions} />
              <ul className="space-y-2">
                {capaParsed.preventive_actions.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Effectiveness Check & Due Date{" "}
                <Sparkles className="h-5 w-5 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    Effectiveness Check
                  </p>
                  <ModifiedBadge
                    field={provenance?.capa?.effectiveness_check}
                  />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {capaParsed.effectiveness_check}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">
                    Due Date
                  </p>
                  <ModifiedBadge field={provenance?.capa?.due_date} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                  {capaParsed.due_date}
                </p>
              </div>
            </CardContent>
          </Card>

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
        </div>

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