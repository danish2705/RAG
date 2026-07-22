import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { saveChangeControlRecord } from "../../services/changeControl/summaryApi";
import { useAuth } from "../../context/AuthContext";

export function useSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Saving is tied directly to the logged-in identity — there is no
  // free-text "saved by" field, so a record can never be attributed to
  // anyone other than the account that actually saved it.
  const handleSaveClick = async () => {
    if (!user?.username) {
      setSaveError("You must be logged in to save a record.");
      return;
    }
    if (
      !result ||
      !classificationParsed ||
      !changeImpactParsed ||
      !riskParsed ||
      !implementationParsed
    ) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      await saveChangeControlRecord({
        query: result.query,
        classification: classificationParsed,
        change_impact_assessment: changeImpactParsed,
        risk_criticality: riskParsed,
        validation_testing: validationTestingParsed,
        implementation_control: implementationParsed,
        final_summary: null,
        status: result.status,
        halted_at: result.haltedAt,
        saved_by: user.displayName || user.username,
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

    handleSaveClick,
  };
}
