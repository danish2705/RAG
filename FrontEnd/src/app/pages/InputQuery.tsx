import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { StepProgressBar } from "../components/qms/StepProgressBar";
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
import { AIAssistant } from "../components/chat/ai-assistant";

// ── Shared types (no more local re-definitions) ───────────────────────────────
import type { PipelineResult } from "../types/pipeline";
import { useWorkflowStore } from "../store/workflowStore";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

// ── Form types ────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function NewDeviation() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
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

  // ── Store ──────────────────────────────────────────────────────────────────
  const setPipelineResult = useWorkflowStore((s) => s.setPipelineResult);

  const isFormReady =
    !!formData.site &&
    !!formData.eventType &&
    !!formData.sourceSystem &&
    !!formData.description.trim() &&
    !!formData.dateTimeDetected;

  // ── File handling ──────────────────────────────────────────────────────────

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

  // ── Field updates ──────────────────────────────────────────────────────────

  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────

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

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const query = buildQueryFromForm(formData);

      const response = await fetch("/api/inputQuery", {
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

      const result: PipelineResult = await response.json();

      // ── Store result globally instead of passing via location.state ──────
      setPipelineResult(result);
      navigate("/deviation/ai-recommendation");
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        <StepProgressBar />

        {submitError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
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
                      <p className="text-xs text-red-500">{errors.site}</p>
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
                      <p className="text-xs text-red-500">
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
                      <p className="text-xs text-red-500">
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
                      <p className="text-xs text-red-500">{errors.eventType}</p>
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
                    <p className="text-xs text-red-500">{errors.description}</p>
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
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors cursor-pointer"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />

                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="text-blue-500 font-medium">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>

                    <p className="text-xs text-muted-foreground">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>

                  {rejectedFiles.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-500/10 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-400">
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
                      <h4 className="text-sm font-medium text-foreground">
                        Uploaded Files ({attachments.length})
                      </h4>

                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {file.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
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

            {/* Submit buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
