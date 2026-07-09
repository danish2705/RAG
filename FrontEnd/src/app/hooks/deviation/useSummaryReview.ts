import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { saveDeviationRecord } from "../../services/deviation/summaryApi";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";

export function useSummaryReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

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

  const impactEntries = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: (PARAMETER_LABELS as Record<string, string>)[key] ?? key,
        severity: val.severity as string,
        description: val.rationale as string,
      }))
    : [];

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
      await saveDeviationRecord({
        query: result!.query,
        classification: classificationParsed,
        impact_assessment: impactParsed,
        rca: rcaParsed,
        capa: capaParsed,
        status: result!.status,
        halted_at: result!.haltedAt,
        saved_by: savedByName.trim(),
        provenance: provenance ?? null,
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
          : "Something went wrong saving the record. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    result, classificationParsed, impactParsed, rcaParsed, capaParsed, provenance,
    chatOpen, setChatOpen,
    isSaving, isSaved, saveError,
    showSavedByDialog, setShowSavedByDialog,
    savedByName, setSavedByName, savedByError, setSavedByError,
    impactEntries,
    handleSaveClick, handleConfirmSave, navigate
  };
}