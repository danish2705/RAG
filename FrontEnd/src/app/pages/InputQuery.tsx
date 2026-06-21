import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Upload, Sparkles, X, Loader2, AlertCircle } from "lucide-react";
import {
  siteOptions,
  eventTypeOptions,
  sourceSystemOptions,
} from "../lib/mockData";

// Backend contract (see src/server.ts on the API side):
//   POST /api/deviations/analyze
//   body: { query: string }   <-- JSON, not multipart/form-data
//   response: PipelineResult  <-- see types below
// The API has no file-upload handling today, so attachments are kept
// client-side only and are NOT sent yet. See the comment near handleSubmit.
const API_URL = "/api/deviations/analyze";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

// ── Backend response types (mirrors src/pipeline/orchestrator.ts) ──────────

type StageName = "classification" | "rca" | "capa";
type GateReasonCode =
  | "invalid_output"
  | "missing_confidence_score"
  | "low_confidence"
  | "blocking_classification"
  | "insufficient_evidence";

interface GateReason {
  code: GateReasonCode;
  detail: string | null;
}

interface GateResult {
  stage: StageName;
  passed: boolean;
  reasons: GateReason[];
  routedTo: "manual_review_queue" | null;
}

interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

interface ClassificationResult {
  classification: string;
  rationale: string;
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
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

interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

interface PipelineStages {
  classification?: (ClassificationResult & { gate: GateResult }) | undefined;
  rca?: (RCAResult & { gate: GateResult }) | undefined;
  capa?: (CAPAResult & { gate: GateResult }) | undefined;
}

export interface PipelineResult {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: StageName | null;
  stages: PipelineStages;
  auditTrail: GateResult[];
  query: string;
  routing?: unknown;
}

// ── Form types ───────────────────────────────────────────────────────────────

interface FormState {
  site: string;
  eventType: string;
  sourceSystem: string;
  description: string;
  batch: string;
  system: string;
  dateTimeDetected: string;
  immediateActions: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function buildQueryFromForm(formData: FormState): string {
  const lines = [
    `Site: ${formData.site}`,
    `Date/Time Detected: ${formData.dateTimeDetected}`,
    `Source System: ${formData.sourceSystem}`,
    `Event Type: ${formData.eventType}`,
    formData.batch ? `Impacted Batch/Lot: ${formData.batch}` : null,
    formData.system ? `Impacted System: ${formData.system}` : null,
    "",
    "Description:",
    formData.description,
  ];

  if (formData.immediateActions.trim()) {
    lines.push("", "Immediate Actions Taken:", formData.immediateActions);
  }

  return lines.filter((line) => line !== null).join("\n");
}

// ── Component ────────────────────────────────────────────────────────────────

export function NewDeviation() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>({
    site: "",
    eventType: "",
    sourceSystem: "",
    description: "",
    batch: "",
    system: "",
    dateTimeDetected: new Date().toISOString().slice(0, 16),
    immediateActions: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Derived: all required fields filled ─────────────────────────────────
  // Required: site, eventType, sourceSystem, description, dateTimeDetected
  // dateTimeDetected is pre-filled to "now" so it's always truthy on load.
  const isFormReady =
    !!formData.site &&
    !!formData.eventType &&
    !!formData.sourceSystem &&
    !!formData.description.trim() &&
    !!formData.dateTimeDetected;

  // ── File handling ────────────────────────────────────────────────────────

  const validateAndAddFiles = (incoming: File[]) => {
    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of incoming) {
      const tooBig = file.size > MAX_FILE_SIZE_BYTES;
      const wrongType = !ALLOWED_FILE_TYPES.includes(file.type);

      if (tooBig || wrongType) {
        rejected.push(
          `${file.name} (${tooBig ? "exceeds 10MB" : "unsupported file type"})`,
        );
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
    }
    setRejectedFiles(rejected);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    validateAndAddFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Field updates ────────────────────────────────────────────────────────

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Validation (runs on submit to surface inline errors) ─────────────────

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.site) nextErrors.site = "Site is required.";
    if (!formData.dateTimeDetected)
      nextErrors.dateTimeDetected = "Date/Time Detected is required.";
    if (!formData.sourceSystem)
      nextErrors.sourceSystem = "Source System is required.";
    if (!formData.eventType) nextErrors.eventType = "Event Type is required.";
    if (!formData.description.trim())
      nextErrors.description = "Detailed Description is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // NOTE: attachments are intentionally NOT sent here. The backend
      // (POST /api/deviations/analyze) only accepts { query: string } JSON
      // and has no multipart/file handling. Once the backend supports
      // attachments, switch this to a FormData request and append them.
      const query = buildQueryFromForm(formData);

      const response = await fetch("http://localhost:3000/inputQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error || `Request failed with status ${response.status}`,
        );
      }

      // Backend returns PipelineResult (status, haltedAt, stages, auditTrail)
      // spread with { query, routing } added by server.ts
      const result: PipelineResult = await response.json();

      navigate("/deviation/ai-recommendation", {
        state: { result, submittedAt: new Date().toISOString() },
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting this event. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Quality Event Intake
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI will classify and route your quality event automatically
        </p>
        {/* Required field legend */}
        <p className="text-xs text-gray-400 mt-1">
          Fields marked <span className="text-red-500 font-medium">*</span> are
          required
        </p>
      </div>

      {submitError && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Couldn&apos;t submit this event</p>
            <p className="mt-1">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site">
                    Site <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={formData.site}
                    onValueChange={(value) => updateField("site", value)}
                  >
                    <SelectTrigger id="site" aria-invalid={!!errors.site}>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>

                    <SelectContent>
                      {siteOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.site && (
                    <p className="text-xs text-red-600">{errors.site}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="datetime">
                    Date/Time Detected <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={formData.dateTimeDetected}
                    onChange={(e) =>
                      updateField("dateTimeDetected", e.target.value)
                    }
                    aria-invalid={!!errors.dateTimeDetected}
                  />
                  {errors.dateTimeDetected && (
                    <p className="text-xs text-red-600">
                      {errors.dateTimeDetected}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceSystem">
                    Source System <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={formData.sourceSystem}
                    onValueChange={(value) =>
                      updateField("sourceSystem", value)
                    }
                  >
                    <SelectTrigger
                      id="sourceSystem"
                      aria-invalid={!!errors.sourceSystem}
                    >
                      <SelectValue placeholder="Select source system" />
                    </SelectTrigger>

                    <SelectContent>
                      {sourceSystemOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sourceSystem && (
                    <p className="text-xs text-red-600">
                      {errors.sourceSystem}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">
                    Event Type <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => updateField("eventType", value)}
                  >
                    <SelectTrigger
                      id="eventType"
                      aria-invalid={!!errors.eventType}
                    >
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>

                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.eventType && (
                    <p className="text-xs text-red-600">{errors.eventType}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Detailed Description <span className="text-red-500">*</span>
                </Label>

                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Provide a detailed description of the deviation..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  aria-invalid={!!errors.description}
                />
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Impacted Batch/Lot</Label>

                  <Input
                    id="batch"
                    placeholder="e.g., LOT-2024-0412"
                    value={formData.batch}
                    onChange={(e) => updateField("batch", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system">Impacted System</Label>

                  <Input
                    id="system"
                    placeholder="e.g., Cold Storage Unit 3"
                    value={formData.system}
                    onChange={(e) => updateField("system", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Immediate Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Immediate Actions Taken</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="immediateActions">Actions Taken</Label>

                <Textarea
                  id="immediateActions"
                  rows={4}
                  placeholder="Describe any immediate containment or corrective actions..."
                  value={formData.immediateActions}
                  onChange={(e) =>
                    updateField("immediateActions", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />

                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-blue-600 font-medium">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>

                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG up to 10MB
                  </p>
                </div>

                {rejectedFiles.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="font-medium mb-1">
                      The following file(s) were not added:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {rejectedFiles.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Uploaded Files ({attachments.length})
                    </h4>

                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>

                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isFormReady}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
