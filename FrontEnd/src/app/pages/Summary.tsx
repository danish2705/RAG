import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

// ── Types (mirrors backend src/llm/schemas.ts) ──────────────────────────────

type StageName = "classification" | "rca" | "capa";

interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

interface ClassificationStage {
  rawText: string;
  parsed: ClassificationParsed | null;
  error: unknown;
  gate: unknown;
}

interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

interface ImpactAssessmentStage {
  rawText: string;
  parsed: ImpactAssessmentParsed | null;
  error: unknown;
  gate: unknown;
}

interface RCAResult {
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_assessment: string;
  confidence_score: number;
}

interface RCAStage {
  rawText: string;
  parsed: RCAResult | null;
  error: unknown;
  gate: unknown;
}

interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

interface CAPAStage {
  rawText: string;
  parsed: CAPAResult | null;
  error: unknown;
  gate: unknown;
}

interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | "impact_assessment" | null;
  stages: {
    classification?: ClassificationStage;
    impactAssessment?: ImpactAssessmentStage;
    rca?: RCAStage;
    capa?: CAPAStage;
  };
  auditTrail: unknown[];
  query: string;
  routing?: unknown;
  correction?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation") return "bg-red-100 text-red-800 border-red-200";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (type === "Hybrid")
    return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 border border-red-200";
    case "major":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "minor":
      return "bg-green-100 text-green-700 border border-green-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
}

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            score >= 80
              ? "bg-green-500"
              : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
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

// ── Component ─────────────────────────────────────────────────────────────

export function Summary() {
  const navigate = useNavigate();
  const location = useLocation();

  const { result } = (location.state ?? {}) as { result?: PipelineResult };

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;
  const rcaParsed = result?.stages?.rca?.parsed ?? null;
  const capaParsed = result?.stages?.capa?.parsed ?? null;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Guard ──────────────────────────────────────────────────────────────
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
            <p className="text-gray-600 font-medium">No summary data found.</p>
            <p className="text-sm text-gray-400 mt-1">
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

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/deviations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error || `Request failed with status ${response.status}`,
        );
      }

      setIsSaved(true);
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

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 px-2"
          onClick={() => navigate("/deviation/capa", { state: { result } })}
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
          <h1 className="text-2xl font-semibold text-gray-900">Summary</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review the complete record before saving
          </p>
        </div>
        {isSaved && (
          <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Saved
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Classification
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Classification:
              </span>
              <Badge
                className={getClassificationBadgeClass(
                  classificationParsed.classification,
                )}
              >
                {classificationParsed.classification}
              </Badge>
            </div>

            <ConfidenceBar score={classificationParsed.confidence_score} />

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                AI Rationale
              </p>
              <ul className="space-y-2">
                {classificationParsed.rationale.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-600"
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
          {impactEntries.map((entry) => (
            <Card key={entry.key} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{entry.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(entry.severity)}`}
                  >
                    {entry.severity}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {entry.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 3. Root Cause Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Primary Root Cause
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Underlying Root Cause
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">
                {rcaParsed.primary_root_cause}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Immediate Cause (direct trigger)
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">
                {rcaParsed.immediate_cause}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Contributing Factors
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rcaParsed.contributing_factors.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
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
              Supporting Evidence
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rcaParsed.evidence.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 4. CAPA */}
        {result.correction && (
          <Card>
            <CardHeader>
              <CardTitle>Correction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">
                {result.correction}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Corrective Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {capaParsed.corrective_actions.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
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
              Preventive Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {capaParsed.preventive_actions.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
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
              Effectiveness Check & Due Date
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Effectiveness Check
              </p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">
                {capaParsed.effectiveness_check}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Due Date</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-md p-3">
                {capaParsed.due_date}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <Card>
          <CardContent className="py-6">
            {saveError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Save failed</p>
                  <p className="mt-1">{saveError}</p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
            <p className="text-xs text-gray-500 mt-3 text-right">
              This record will be logged in the audit trail
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
