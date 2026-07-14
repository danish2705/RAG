import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { generateRootCauseAnalysis } from "../../services/deviation/rcaApi";
import {
  aiField,
  markModified,
  type ImpactAssessmentProvenance,
} from "../../types/dataProvenance";
import type {
  ImpactSeverity,
  RCAApiResponse,
  AssessmentItem,
} from "../../types/pipeline";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";

export function useImpactAssessmentReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

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

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [assessments, setAssessments] =
    useState<AssessmentItem[]>(initialAssessments);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
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

  const buildImpactProvenance = (
    confirmed: boolean,
  ): ImpactAssessmentProvenance => {
    const keys = [
      "product_impact",
      "patient_impact",
      "data_integrity_impact",
      "compliance_impact",
    ] as const;

    const entries = Object.fromEntries(
      keys.map((key, i) => {
        const a = assessments[i];
        const modified =
          confirmed &&
          (a?.severity !== a?.originalSeverity ||
            a?.description !== a?.originalDescription);

        return [
          key,
          {
            severity: modified
              ? markModified(aiField(a.originalSeverity), a.severity)
              : aiField(a.originalSeverity),
            rationale: modified
              ? markModified(aiField(a.originalDescription), a.description)
              : aiField(a.originalDescription),
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
      setRcaError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating the root cause analysis. Please try again.",
      );
    } finally {
      setIsGeneratingRCA(false);
    }
  };

  const handleAccept = () => {
    const impactProvenance = buildImpactProvenance(overrideConfirmed);
    const existingRCA = result!.stages?.rca;

    if (!overrideConfirmed && existingRCA?.parsed) {
      navigateToRCA(
        existingRCA,
        impactProvenance,
        buildApprovedImpactAssessment(),
      );
      return;
    }

    void runRCA(impactProvenance);
  };

  const handleOverrideClick = () => setIsOverrideEditing(true);

  const handleSaveChanges = () => {
    const needsDescription = assessments
      .filter((a) => a.severityChangedWithoutDescription)
      .map((a) => a.category);
    if (needsDescription.length > 0) {
      setWarningCards(needsDescription);
      setShowDescriptionWarning(true);
      return;
    }
    setShowOverrideDialog(true);
  };

  const handleCancelOverride = () => {
    setIsOverrideEditing(false);
    setAssessments((prev) =>
      prev.map((a) => ({
        ...a,
        severity: a.originalSeverity,
        description: a.originalDescription,
        severityChangedWithoutDescription: false,
      })),
    );
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
    classificationParsed,
    impactParsed,
    chatOpen,
    setChatOpen,
    assessments,
    isOverrideEditing,
    overrideConfirmed,
    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
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
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}
