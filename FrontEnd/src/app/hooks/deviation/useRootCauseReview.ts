import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { generateCapaRecommendations } from "../../services/deviation/capaApi";
import {
  aiField,
  markModified,
  type RCAProvenance,
} from "../../types/dataProvenance";
import type { RCAResult, CAPAApiResponse } from "../../types/pipeline";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

export function useRootCauseReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const llmFailure = useLlmFailureRecovery();

  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const rcaParsed = result?.stages?.rca?.parsed ?? null;
  const savedRcaProvenance = result?.provenance?.rca;

  const wasModified =
    savedRcaProvenance?.primary_root_cause?.source === "modified" ||
    savedRcaProvenance?.immediate_cause?.source === "modified" ||
    savedRcaProvenance?.contributing_factors?.source === "modified" ||
    savedRcaProvenance?.evidence?.source === "modified";

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);

  const [primaryRootCause, setPrimaryRootCause] = useState(
    wasModified
      ? (savedRcaProvenance!.primary_root_cause.value as string)
      : (rcaParsed?.primary_root_cause ?? ""),
  );
  const [immediateCause, setImmediateCause] = useState(
    wasModified
      ? (savedRcaProvenance!.immediate_cause.value as string)
      : (rcaParsed?.immediate_cause ?? ""),
  );
  const [contributingFactors, setContributingFactors] = useState(
    wasModified
      ? (savedRcaProvenance!.contributing_factors.value as string[]).join("\n")
      : (rcaParsed?.contributing_factors ?? []).join("\n"),
  );
  const [evidence, setEvidence] = useState(
    wasModified
      ? (savedRcaProvenance!.evidence.value as string[]).join("\n")
      : (rcaParsed?.evidence ?? []).join("\n"),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [isGeneratingCAPA, setIsGeneratingCAPA] = useState(false);
  const [capaError, setCapaError] = useState<string | null>(null);

  const buildRCAProvenance = (confirmed: boolean): RCAProvenance => {
    if (!rcaParsed) return {} as RCAProvenance;

    const curFactors = contributingFactors
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const curEvidence = evidence
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      primary_root_cause:
        confirmed && primaryRootCause !== rcaParsed.primary_root_cause
          ? markModified(
              aiField(rcaParsed.primary_root_cause),
              primaryRootCause,
            )
          : aiField(rcaParsed.primary_root_cause),
      immediate_cause:
        confirmed && immediateCause !== rcaParsed.immediate_cause
          ? markModified(aiField(rcaParsed.immediate_cause), immediateCause)
          : aiField(rcaParsed.immediate_cause),
      contributing_factors:
        confirmed &&
        JSON.stringify(curFactors) !==
          JSON.stringify(rcaParsed.contributing_factors)
          ? markModified(aiField(rcaParsed.contributing_factors), curFactors)
          : aiField(rcaParsed.contributing_factors),
      evidence:
        confirmed &&
        JSON.stringify(curEvidence) !== JSON.stringify(rcaParsed.evidence)
          ? markModified(aiField(rcaParsed.evidence), curEvidence)
          : aiField(rcaParsed.evidence),
      sequence_of_events: rcaParsed.sequence_of_events,
      impact_summary: rcaParsed.impact_summary,
      confidence_score: rcaParsed.confidence_score,
    };
  };

  const buildApprovedRCA = (): RCAResult => ({
    ...rcaParsed!,
    primary_root_cause: primaryRootCause,
    immediate_cause: immediateCause,
    contributing_factors: contributingFactors
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    evidence: evidence
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const navigateToCAPA = (
    capaStage: CAPAApiResponse["stages"]["capa"],
    rcaProvenance: RCAProvenance,
    approvedRCA: RCAResult,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        rca: { ...result!.stages.rca!, parsed: approvedRCA },
        capa: capaStage,
      },
      provenance: { ...result!.provenance, rca: rcaProvenance },
    });
    navigate("/deviation/capa");
  };

  const runCAPA = async (rcaProvenance: RCAProvenance) => {
    setCapaError(null);
    const approvedRCA = buildApprovedRCA();
    const approvedClassification = result!.stages?.classification?.parsed;
    const approvedImpactAssessment = result!.stages?.impactAssessment?.parsed;

    if (!approvedClassification || !approvedImpactAssessment) {
      setCapaError(
        "Missing approved classification or impact assessment data — please go back and complete those steps before generating CAPA.",
      );
      return;
    }

    setIsGeneratingCAPA(true);
    try {
      const capaResult = await generateCapaRecommendations(
        result!.query,
        approvedClassification,
        approvedImpactAssessment,
        approvedRCA,
      );
      navigateToCAPA(capaResult.stages.capa, rcaProvenance, approvedRCA);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong generating CAPA recommendations. Please try again.";
      setCapaError(message);
      // `result` predates this Accept — patch in the just-approved RCA so
      // Resume doesn't lose the approval that was just made.
      const patchedResult = result
        ? {
            ...result,
            stages: {
              ...result.stages,
              rca: { ...result.stages.rca!, parsed: approvedRCA },
            },
            provenance: { ...result.provenance, rca: rcaProvenance },
          }
        : null;
      llmFailure.openLlmFailureDialog({
        entityType: "Deviation",
        pipelineStage: "capa",
        queryText: result?.query ?? "",
        errorMessage: message,
        pipelineContext: patchedResult,
      });
    } finally {
      setIsGeneratingCAPA(false);
    }
  };

  const handleAccept = () => {
    const rcaProvenance = buildRCAProvenance(overrideConfirmed);
    const existingCAPA = result!.stages?.capa;
    const approvedRCA = buildApprovedRCA();

    if (!overrideConfirmed && existingCAPA?.parsed) {
      navigateToCAPA(existingCAPA, rcaProvenance, approvedRCA);
      return;
    }
    void runCAPA(rcaProvenance);
  };

  const handleCancelOverride = () => {
    if (!rcaParsed) return;
    if (wasModified && savedRcaProvenance) {
      setPrimaryRootCause(
        savedRcaProvenance.primary_root_cause.value as string,
      );
      setImmediateCause(savedRcaProvenance.immediate_cause.value as string);
      setContributingFactors(
        (savedRcaProvenance.contributing_factors.value as string[]).join("\n"),
      );
      setEvidence((savedRcaProvenance.evidence.value as string[]).join("\n"));
    } else {
      setPrimaryRootCause(rcaParsed.primary_root_cause ?? "");
      setImmediateCause(rcaParsed.immediate_cause ?? "");
      setContributingFactors((rcaParsed.contributing_factors ?? []).join("\n"));
      setEvidence((rcaParsed.evidence ?? []).join("\n"));
    }
    setIsOverrideEditing(false);
  };

  const handleOverrideConfirm = () => {
    if (!overrideJustification.trim()) return;
    setShowOverrideDialog(false);
    setIsOverrideEditing(false);
    setOverrideConfirmed(true);
    setOverrideJustification("");
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  return {
    result,
    rcaParsed,
    chatOpen,
    setChatOpen,
    isOverrideEditing,
    setIsOverrideEditing,
    overrideConfirmed,
    primaryRootCause,
    setPrimaryRootCause,
    immediateCause,
    setImmediateCause,
    contributingFactors,
    setContributingFactors,
    evidence,
    setEvidence,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    isGeneratingCAPA,
    capaError,
    handleAccept,
    handleOverrideClick: () => setIsOverrideEditing(true),
    handleSaveChanges: () => setShowOverrideDialog(true),
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
    llmFailure,
  };
}
