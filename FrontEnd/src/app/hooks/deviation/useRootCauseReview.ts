import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { generateCapaRecommendations } from "../../services/deviation/capaApi";
import { autoField, type RCAProvenance } from "../../types/dataProvenance";
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

  // Fields are directly editable at all times — seeded from a previously
  // saved edit (if resuming) or the raw AI output, but freely changeable
  // without first entering any separate "override" mode.
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

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [discardJustification, setDiscardJustification] = useState("");
  // Only surfaced after the user discards the analysis (and the fields get
  // cleared) — hidden otherwise.
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  // Client-side check so an accidental Accept right after Discard clears the
  // fields doesn't silently save empty data to the audit trail.
  const [emptyFieldsWarning, setEmptyFieldsWarning] = useState<string | null>(
    null,
  );

  const [isGeneratingCAPA, setIsGeneratingCAPA] = useState(false);
  const [capaError, setCapaError] = useState<string | null>(null);

  const buildRCAProvenance = (): RCAProvenance => {
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
      primary_root_cause: autoField(
        rcaParsed.primary_root_cause,
        primaryRootCause,
      ),
      immediate_cause: autoField(rcaParsed.immediate_cause, immediateCause),
      contributing_factors: autoField(
        rcaParsed.contributing_factors,
        curFactors,
      ),
      evidence: autoField(rcaParsed.evidence, curEvidence),
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

  // Accept stays disabled until every field is filled in — most notably
  // right after a Discard clears them.
  const canAccept =
    primaryRootCause.trim() !== "" &&
    immediateCause.trim() !== "" &&
    contributingFactors.trim() !== "" &&
    evidence.trim() !== "";

  const handleAccept = () => {
    // Guard against accepting right after a Discard cleared the fields —
    // don't silently save empty data to the audit trail.
    if (
      primaryRootCause.trim() === "" ||
      immediateCause.trim() === "" ||
      contributingFactors.trim() === "" ||
      evidence.trim() === ""
    ) {
      setEmptyFieldsWarning(
        "One or more root cause fields are empty. Please fill them in before accepting.",
      );
      return;
    }
    setEmptyFieldsWarning(null);

    const rcaProvenance = buildRCAProvenance();
    const isEdited =
      rcaProvenance.primary_root_cause?.source === "modified" ||
      rcaProvenance.immediate_cause?.source === "modified" ||
      rcaProvenance.contributing_factors?.source === "modified" ||
      rcaProvenance.evidence?.source === "modified";
    const existingCAPA = result!.stages?.capa;
    const approvedRCA = buildApprovedRCA();

    if (!isEdited && existingCAPA?.parsed) {
      navigateToCAPA(existingCAPA, rcaProvenance, approvedRCA);
      return;
    }
    void runCAPA(rcaProvenance);
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    // Clear the AI-generated fields — the user discarded the AI's
    // suggestion, so we don't leave it sitting in the form. They can
    // either fill this in manually or pull the AI suggestion back in
    // with the button above.
    setPrimaryRootCause("");
    setImmediateCause("");
    setContributingFactors("");
    setEvidence("");
    setShowAiSuggestion(true);
  };

  // Restores the original AI-generated root cause analysis into the form —
  // used by the "AI Suggestion" button so a discarded/cleared field can be
  // brought back.
  const handleGetAiSuggestion = () => {
    if (!rcaParsed) return;
    setPrimaryRootCause(rcaParsed.primary_root_cause ?? "");
    setImmediateCause(rcaParsed.immediate_cause ?? "");
    setContributingFactors((rcaParsed.contributing_factors ?? []).join("\n"));
    setEvidence((rcaParsed.evidence ?? []).join("\n"));
  };

  return {
    result,
    rcaParsed,
    chatOpen,
    setChatOpen,
    primaryRootCause,
    setPrimaryRootCause,
    immediateCause,
    setImmediateCause,
    contributingFactors,
    setContributingFactors,
    evidence,
    setEvidence,
    showDiscardDialog,
    setShowDiscardDialog,
    discardJustification,
    setDiscardJustification,
    showAiSuggestion,
    emptyFieldsWarning,
    canAccept,
    isGeneratingCAPA,
    capaError,
    handleAccept,
    handleDiscard,
    handleGetAiSuggestion,
    llmFailure,
  };
}