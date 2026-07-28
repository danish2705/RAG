import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { generateRootCauseAnalysis } from "../../services/deviation/rcaApi";
import {
  autoField,
  type ImpactAssessmentProvenance,
} from "../../types/dataProvenance";
import type {
  ImpactSeverity,
  RCAApiResponse,
  AssessmentItem,
} from "../../types/pipeline";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

export function useImpactAssessmentReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const llmFailure = useLlmFailureRecovery();

  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const impactParsed = result?.stages?.impactAssessment?.parsed ?? null;

  const initialAssessments: AssessmentItem[] = impactParsed
    ? Object.entries(impactParsed.impact_assessment).map(([key, val]) => ({
        key,
        category: (PARAMETER_LABELS as Record<string, string>)[key] ?? key,
        severity: val.severity as ImpactSeverity,
        description: val.rationale,
        originalSeverity: val.severity as ImpactSeverity,
        originalDescription: val.rationale,
        severityChangedWithoutDescription: false,
      }))
    : [];

  // Fields are directly editable at all times — this holds the live form
  // values, seeded from the AI output but freely changeable without first
  // entering any separate "override" mode.
  const [assessments, setAssessments] =
    useState<AssessmentItem[]>(initialAssessments);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const [showDescriptionWarning, setShowDescriptionWarning] = useState(false);
  const [warningCards, setWarningCards] = useState<string[]>([]);

  const [isGeneratingRCA, setIsGeneratingRCA] = useState(false);
  const [rcaError, setRcaError] = useState<string | null>(null);

  const updateSeverity = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], severity: value as ImpactSeverity };
      item.severityChangedWithoutDescription = value !== item.originalSeverity;
      updated[index] = item;
      return updated;
    });
  };

  const updateDescription = (index: number, value: string) => {
    setAssessments((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], description: value };
      if (value !== item.originalDescription) {
        item.severityChangedWithoutDescription = false;
      }
      updated[index] = item;
      return updated;
    });
  };

  const buildImpactProvenance = (): ImpactAssessmentProvenance => {
    const keys = [
      "product_impact",
      "patient_impact",
      "data_integrity_impact",
      "compliance_impact",
    ] as const;

    const entries = Object.fromEntries(
      keys.map((key, i) => {
        const a = assessments[i];
        return [
          key,
          {
            severity: autoField(a.originalSeverity, a.severity),
            rationale: autoField(a.originalDescription, a.description),
          },
        ];
      }),
    );

    return {
      impact_assessment: entries as any, // Cast to any to avoid strict interface mapping errors
      confidence_score: impactParsed!.confidence_score,
    };
  };

  const buildApprovedImpactAssessment = () => {
    // Explicitly rebuild the object to bypass TypeScript's generic dictionary errors
    const updatedImpact = {} as Record<
      string,
      { severity: ImpactSeverity; rationale: string }
    >;

    assessments.forEach((a) => {
      updatedImpact[a.key] = { severity: a.severity, rationale: a.description };
    });

    return {
      ...impactParsed!,
      impact_assessment: updatedImpact as any, // Cast to any to bypass missing strict properties error
    };
  };

  const navigateToRCA = (
    rcaStage: RCAApiResponse["stages"]["rca"],
    impactProvenance: ImpactAssessmentProvenance,
    approvedImpactAssessment: any,
  ) => {
    mergePipelineResult({
      stages: {
        ...result!.stages,
        impactAssessment: {
          ...result!.stages.impactAssessment!,
          parsed: approvedImpactAssessment,
        },
        rca: rcaStage,
      },
      provenance: { ...result!.provenance, impactAssessment: impactProvenance },
    });
    navigate("/deviation/root-cause");
  };

  const runRCA = async (impactProvenance: ImpactAssessmentProvenance) => {
    setRcaError(null);
    setIsGeneratingRCA(true);
    const approvedImpactAssessment = buildApprovedImpactAssessment();
    try {
      const rcaResult = await generateRootCauseAnalysis(
        result!.query,
        classificationParsed!,
        approvedImpactAssessment,
      );
      navigateToRCA(
        rcaResult.stages.rca,
        impactProvenance,
        approvedImpactAssessment,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong generating the root cause analysis. Please try again.";
      setRcaError(message);
      // `result` in the store still has the pre-Accept impact assessment —
      // the human's just-approved values (approvedImpactAssessment /
      // impactProvenance) only get merged in on success. Patch them in here
      // so Resume doesn't silently lose the approval that was just made.
      const patchedResult = result
        ? {
            ...result,
            stages: {
              ...result.stages,
              impactAssessment: {
                ...result.stages.impactAssessment!,
                parsed: approvedImpactAssessment,
              },
            },
            provenance: {
              ...result.provenance,
              impactAssessment: impactProvenance,
            },
          }
        : null;
      llmFailure.openLlmFailureDialog({
        entityType: "Deviation",
        pipelineStage: "rca",
        queryText: result?.query ?? "",
        errorMessage: message,
        pipelineContext: patchedResult,
      });
    } finally {
      setIsGeneratingRCA(false);
    }
  };

  const handleAccept = () => {
    // If a severity was changed but its description wasn't updated to
    // explain why, block Accept and ask for that first — same guardrail
    // that used to live in the old "Save Changes" step, just triggered by
    // Accept directly now that there's no separate override mode.
    const needsDescription = assessments
      .filter((a) => a.severityChangedWithoutDescription)
      .map((a) => a.category);
    if (needsDescription.length > 0) {
      setWarningCards(needsDescription);
      setShowDescriptionWarning(true);
      return;
    }

    const impactProvenance = buildImpactProvenance();
    const isEdited = Object.values(impactProvenance.impact_assessment).some(
      (item: any) =>
        item.severity.source === "modified" ||
        item.rationale.source === "modified",
    );
    const existingRCA = result!.stages?.rca;

    if (!isEdited && existingRCA?.parsed) {
      navigateToRCA(
        existingRCA,
        impactProvenance,
        buildApprovedImpactAssessment(),
      );
      return;
    }

    void runRCA(impactProvenance);
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate("/deviation");
    }
  };

  return {
    result,
    classificationParsed,
    impactParsed,
    chatOpen,
    setChatOpen,
    assessments,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,
    showDescriptionWarning,
    setShowDescriptionWarning,
    warningCards,
    isGeneratingRCA,
    rcaError,
    updateSeverity,
    updateDescription,
    handleAccept,
    handleReject,
    llmFailure,
  };
}
