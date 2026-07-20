import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { assessDeviationImpact } from "../../services/deviation/impactAssessmentApi";
import { assessChangeControlImpact } from "../../services/changeControl/impactAssessmentApi";
import { parseRationaleLines } from "../../utils/deviation/classification";
import {
  aiField,
  markModified,
  type ClassificationProvenance,
  type DataField,
} from "../../types/dataProvenance";
import type {
  ClassificationParsed,
  ClassificationType,
} from "../../types/pipeline";
import { flatToNestedChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

export function useClassificationReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationStage = result?.stages?.classification;
  const parsed = classificationStage?.parsed;

  // Safely cast to bypass the missing property on the original type
  const insufficientInput = (
    classificationStage as
      | { insufficientInput?: { reason: string } }
      | undefined
  )?.insufficientInput;

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [editedClassification, setEditedClassification] =
    useState<ClassificationType>(parsed?.classification ?? "Deviation");
  const [editedRationale, setEditedRationale] = useState(
    (parsed?.rationale ?? []).join("\n"),
  );
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const llmFailure = useLlmFailureRecovery();

  const rationaleLines = useMemo(
    () => parseRationaleLines(editedRationale),
    [editedRationale],
  );

  const buildClassificationProvenance = useCallback(
    (isOverride: boolean): ClassificationProvenance => {
      if (isOverride && parsed) {
        return {
          classification: markModified(
            aiField(parsed.classification),
            editedClassification,
          ) as DataField<ClassificationType>,
          rationale: markModified(aiField(parsed.rationale), rationaleLines),
          confidence_score: parsed.confidence_score,
        };
      }
      return {
        classification: aiField(parsed!.classification),
        rationale: aiField(parsed!.rationale),
        confidence_score: parsed!.confidence_score,
      };
    },
    [parsed, editedClassification, rationaleLines],
  );

  const runImpactAssessment = useCallback(
    async (
      approvedClassification: ClassificationParsed,
      classificationProvenance: ClassificationProvenance,
    ) => {
      setAssessError(null);
      setIsAssessing(true);

      const isChangeControl =
        approvedClassification.classification === "Change Control";

      try {
        if (isChangeControl) {
          const changeImpactResult = await assessChangeControlImpact(
            result!.query,
            approvedClassification,
          );
          const rawStage = changeImpactResult.stages.changeImpactAssessment;

          mergePipelineResult({
            stages: {
              ...result!.stages,
              classification: {
                ...result!.stages.classification!,
                parsed: approvedClassification,
              },
              changeImpactAssessment: rawStage
                ? {
                    rawText: rawStage.rawText,
                    error: rawStage.error,
                    gate: rawStage.gate as any,
                    parsed: rawStage.parsed
                      ? flatToNestedChangeImpactAssessment(rawStage.parsed)
                      : null,
                  }
                : undefined,
            },
            provenance: {
              ...result!.provenance,
              classification: classificationProvenance,
            },
          });

          navigate("/change-control/change-impact-assessment");
        } else {
          const impactResult = await assessDeviationImpact(
            result!.query,
            approvedClassification,
          );

          mergePipelineResult({
            stages: {
              ...result!.stages,
              classification: {
                ...result!.stages.classification!,
                parsed: approvedClassification,
              },
              impactAssessment: impactResult.stages.impactAssessment,
            },
            provenance: {
              ...result!.provenance,
              classification: classificationProvenance,
            },
          });

          navigate("/deviation/impact-assessment");
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong running the impact assessment. Please try again.";
        setAssessError(message);
        // Same reasoning as the later stages: `result` predates this
        // Accept, so patch in the just-approved classification manually
        // rather than saving the stale pre-accept snapshot.
        const patchedResult = result
          ? {
              ...result,
              stages: {
                ...result.stages,
                classification: {
                  ...result.stages.classification!,
                  parsed: approvedClassification,
                },
              },
              provenance: {
                ...result.provenance,
                classification: classificationProvenance,
              },
            }
          : null;
        llmFailure.openLlmFailureDialog({
          entityType: isChangeControl ? "Change Control" : "Deviation",
          pipelineStage: isChangeControl
            ? "change_impact_assessment"
            : "impact_assessment",
          queryText: result?.query ?? "",
          errorMessage: message,
          pipelineContext: patchedResult,
        });
      } finally {
        setIsAssessing(false);
      }
    },
    [result, mergePipelineResult, navigate, llmFailure],
  );

  const handleAccept = useCallback(() => {
    if (!parsed) return;

    const isOverride = overrideConfirmed;
    const approvedClassification: ClassificationParsed = isOverride
      ? {
          ...parsed,
          classification: editedClassification,
          rationale: rationaleLines,
        }
      : parsed;
    const classificationProvenance = buildClassificationProvenance(isOverride);
    const isChangeControl =
      approvedClassification.classification === "Change Control";

    if (isChangeControl) {
      const existingChangeImpactAssessment =
        result!.stages?.changeImpactAssessment;
      if (!isOverride && existingChangeImpactAssessment?.parsed) {
        mergePipelineResult({
          stages: {
            ...result!.stages,
            classification: {
              ...result!.stages.classification!,
              parsed: approvedClassification,
            },
            changeImpactAssessment: existingChangeImpactAssessment,
          },
          provenance: {
            ...result!.provenance,
            classification: classificationProvenance,
          },
        });
        navigate("/change-control/change-impact-assessment");
        return;
      }
    } else {
      const existingImpactAssessment = result!.stages?.impactAssessment;
      if (!isOverride && existingImpactAssessment?.parsed) {
        mergePipelineResult({
          stages: {
            ...result!.stages,
            classification: {
              ...result!.stages.classification!,
              parsed: approvedClassification,
            },
            impactAssessment: existingImpactAssessment,
          },
          provenance: {
            ...result!.provenance,
            classification: classificationProvenance,
          },
        });
        navigate("/deviation/impact-assessment");
        return;
      }
    }

    void runImpactAssessment(approvedClassification, classificationProvenance);
  }, [
    overrideConfirmed,
    parsed,
    editedClassification,
    rationaleLines,
    buildClassificationProvenance,
    result,
    mergePipelineResult,
    navigate,
    runImpactAssessment,
  ]);

  const handleOverrideClick = useCallback(() => setIsOverrideEditing(true), []);
  const handleSaveChanges = useCallback(() => setShowOverrideDialog(true), []);

  const handleCancelOverride = useCallback(() => {
    setIsOverrideEditing(false);
    if (parsed) {
      setEditedClassification(parsed.classification);
      setEditedRationale((parsed.rationale ?? []).join("\n"));
    }
  }, [parsed]);

  const handleOverrideConfirm = useCallback(() => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
  }, [overrideJustification]);

  const handleReject = useCallback(() => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  }, [rejectJustification, navigate]);

  const currentClassification = overrideConfirmed
    ? editedClassification
    : (parsed?.classification ?? "Deviation");

  return {
    result,
    parsed,
    insufficientInput,
    chatOpen,
    setChatOpen,
    isOverrideEditing,
    setIsOverrideEditing,
    editedClassification,
    setEditedClassification,
    editedRationale,
    setEditedRationale,
    rationaleLines,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    isAssessing,
    assessError,
    overrideConfirmed,
    currentClassification,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
    llmFailure,
  };
}
