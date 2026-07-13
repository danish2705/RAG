import { useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import { useWorkflowStore } from "../../store/workflowStore";

export function useSummary() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
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
    if (!result || !classificationParsed || !changeImpactParsed || !riskParsed || !implementationParsed) {
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

  return {
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
  };
}