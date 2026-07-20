import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../utils/api";
import { buildQueryFromForm } from "../utils/inputQuery/buildQuery";
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from "../mocks/mockInputQuery";
import { useWorkflowStore } from "../store/workflowStore";
import type { PipelineResult } from "../types/pipeline";
import type { FormState, FormErrors } from "../types/InputQuery";

export function useInputQueryForm() {
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

  const setPipelineResult = useWorkflowStore((s) => s.setPipelineResult);

  const isFormReady =
    !!formData.site &&
    !!formData.eventType &&
    !!formData.sourceSystem &&
    !!formData.description.trim() &&
    !!formData.dateTimeDetected;

  // File handling
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

  // Field updates
  const updateField = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Validation
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const query = buildQueryFromForm(formData);
      const result: PipelineResult = await apiFetch("/api/inputQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

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

  return {
    navigate,
    fileInputRef,
    chatOpen,
    setChatOpen,
    formData,
    errors,
    attachments,
    rejectedFiles,
    isSubmitting,
    submitError,
    isFormReady,
    updateField,
    handleFileUpload,
    handleDrop,
    handleDragOver,
    removeFile,
    handleSubmit,
  };
}