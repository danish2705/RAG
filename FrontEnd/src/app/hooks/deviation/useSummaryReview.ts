import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { saveDeviationRecord } from "../../services/deviation/summaryApi";
import { useAuth } from "../../context/AuthContext";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";

export function useSummaryReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const impactEntries = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: (PARAMETER_LABELS as Record<string, string>)[key] ?? key,
        severity: val.severity as string,
        description: val.rationale as string,
      }))
    : [];

  // Saving is tied directly to the logged-in identity — there is no
  // free-text "saved by" field, so a record can never be attributed to
  // anyone other than the account that actually saved it.
  const handleSaveClick = async () => {
    if (!user?.username) {
      setSaveError("You must be logged in to save a record.");
      return;
    }

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
    impactEntries,
    handleSaveClick,
    navigate
  };
}