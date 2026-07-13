import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiFetch } from "../../utils/api";
import {
  aiField,
  markModified,
  type ImplementationControlProvenance,
} from "../../types/dataProvenance";
import type { ImplementationControlParsed } from "../../types/pipeline";
import { useWorkflowStore } from "../../store/workflowStore";
import { nestedToFlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import {
  flatToNestedImplementationControl,
  nestedToFlatValidationTesting,
} from "../../utils/changeControlAdapters";

// Helpers — mirrors the list <-> textarea convention used on
// RiskCriticality.tsx / ValidationTesting.tsx
function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines: string[]): string {
  return lines.join("\n");
}

export function useImplementationControl() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  // Read from store
  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const classificationParsed = result?.stages?.classification?.parsed ?? null;
  const riskParsed = result?.stages?.riskCriticality?.parsed ?? null;
  const implementationParsed =
    result?.stages?.implementationControl?.parsed ?? null;

  // Auto-generate the AI recommendation for this stage the first time it's
  // visited, mirroring how earlier stages hand data forward on Accept.
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!result || implementationParsed || isGenerating) return;

    let cancelled = false;
    setIsGenerating(true);
    setGenerateError(null);

    const changeImpactAssessmentParsed =
      result.stages?.changeImpactAssessment?.parsed ?? null;
    const validationTestingParsed =
      result.stages?.validationTesting?.parsed ?? null;

    apiFetch<any>("/api/change-control/implementation-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: result.query,
        changeImpactAssessment: changeImpactAssessmentParsed
          ? nestedToFlatChangeImpactAssessment(changeImpactAssessmentParsed)
          : null,
        riskCriticality: result.stages?.riskCriticality?.parsed ?? null,
        validationTesting: validationTestingParsed
          ? nestedToFlatValidationTesting(validationTestingParsed)
          : null,
      }),
    })
      .then((res) => {
        if (cancelled) return;
        const rawStage = res?.stages?.implementationControl;
        mergePipelineResult({
          stages: {
            ...result.stages,
            implementationControl: rawStage
              ? {
                  ...rawStage,
                  parsed: rawStage.parsed
                    ? flatToNestedImplementationControl(rawStage.parsed)
                    : null,
                }
              : undefined,
          },
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setGenerateError(
          err instanceof Error
            ? err.message
            : "Something went wrong generating implementation & control actions. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, implementationParsed]);

  const savedProvenance = result?.provenance?.implementationControl;
  const wasModified =
    savedProvenance?.required_actions?.source === "modified" ||
    savedProvenance?.sop_wi_updates?.source === "modified" ||
    savedProvenance?.approval_routing?.source === "modified" ||
    savedProvenance?.implementation_plan?.source === "modified" ||
    savedProvenance?.rollback_contingency_plan?.source === "modified";

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);
  const [implementationAccepted, setImplementationAccepted] = useState(false);

  const [requiredActions, setRequiredActions] = useState(
    wasModified
      ? linesToText(savedProvenance!.required_actions.value)
      : linesToText(implementationParsed?.required_actions ?? []),
  );
  const [sopWiUpdates, setSopWiUpdates] = useState(
    wasModified
      ? linesToText(savedProvenance!.sop_wi_updates.value)
      : linesToText(implementationParsed?.sop_wi_updates ?? []),
  );
  const [approvalRouting, setApprovalRouting] = useState(
    wasModified
      ? linesToText(savedProvenance!.approval_routing.value)
      : linesToText(implementationParsed?.approval_routing ?? []),
  );
  const [implementationPlan, setImplementationPlan] = useState(
    wasModified
      ? (savedProvenance!.implementation_plan.value as string)
      : (implementationParsed?.implementation_plan ?? ""),
  );
  const [rollbackPlan, setRollbackPlan] = useState(
    wasModified
      ? (savedProvenance!.rollback_contingency_plan.value as string)
      : (implementationParsed?.rollback_contingency_plan ?? ""),
  );

  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  // Re-hydrate local editable state whenever a new AI result lands in the
  // store (mirrors the pattern used on RiskCriticality.tsx).
  useEffect(() => {
    if (!implementationParsed) return;
    setRequiredActions(linesToText(implementationParsed.required_actions));
    setSopWiUpdates(linesToText(implementationParsed.sop_wi_updates));
    setApprovalRouting(linesToText(implementationParsed.approval_routing));
    setImplementationPlan(implementationParsed.implementation_plan);
    setRollbackPlan(implementationParsed.rollback_contingency_plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implementationParsed]);

  const decisionMade =
    implementationAccepted || isOverrideEditing || overrideConfirmed;

  // Provenance + approved result builders
  const buildProvenance = (
    confirmed: boolean,
  ): ImplementationControlProvenance | null => {
    if (!implementationParsed) return null;
    const curRequiredActions = parseLines(requiredActions);
    const curSopWiUpdates = parseLines(sopWiUpdates);
    const curApprovalRouting = parseLines(approvalRouting);

    return {
      required_actions:
        confirmed &&
        JSON.stringify(curRequiredActions) !==
          JSON.stringify(implementationParsed.required_actions)
          ? markModified(
              aiField(implementationParsed.required_actions),
              curRequiredActions,
            )
          : aiField(implementationParsed.required_actions),
      sop_wi_updates:
        confirmed &&
        JSON.stringify(curSopWiUpdates) !==
          JSON.stringify(implementationParsed.sop_wi_updates)
          ? markModified(
              aiField(implementationParsed.sop_wi_updates),
              curSopWiUpdates,
            )
          : aiField(implementationParsed.sop_wi_updates),
      approval_routing:
        confirmed &&
        JSON.stringify(curApprovalRouting) !==
          JSON.stringify(implementationParsed.approval_routing)
          ? markModified(
              aiField(implementationParsed.approval_routing),
              curApprovalRouting,
            )
          : aiField(implementationParsed.approval_routing),
      implementation_plan:
        confirmed &&
        implementationPlan !== implementationParsed.implementation_plan
          ? markModified(
              aiField(implementationParsed.implementation_plan),
              implementationPlan,
            )
          : aiField(implementationParsed.implementation_plan),
      rollback_contingency_plan:
        confirmed &&
        rollbackPlan !== implementationParsed.rollback_contingency_plan
          ? markModified(
              aiField(implementationParsed.rollback_contingency_plan),
              rollbackPlan,
            )
          : aiField(implementationParsed.rollback_contingency_plan),
      confidence_score: implementationParsed.confidence_score,
    };
  };

  const buildApprovedImplementation =
    (): ImplementationControlParsed | null =>
      implementationParsed
        ? {
            ...implementationParsed,
            required_actions: parseLines(requiredActions),
            sop_wi_updates: parseLines(sopWiUpdates),
            approval_routing: parseLines(approvalRouting),
            implementation_plan: implementationPlan,
            rollback_contingency_plan: rollbackPlan,
          }
        : null;

  const proceed = () => {
    if (!result || !implementationParsed) return;
    const provenance = buildProvenance(overrideConfirmed);
    mergePipelineResult({
      stages: {
        ...result.stages,
        implementationControl: {
          ...result.stages.implementationControl!,
          parsed: buildApprovedImplementation()!,
        },
      },
      provenance: { ...result.provenance, implementationControl: provenance! },
    });
    navigate("/change-control/summary");
  };

  // Handlers
  const handleAccept = () => setImplementationAccepted(true);
  const handleOverrideClick = () => setIsOverrideEditing(true);
  const handleSaveChanges = () => setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (!implementationParsed) return;
    if (wasModified) {
      setRequiredActions(linesToText(savedProvenance!.required_actions.value));
      setSopWiUpdates(linesToText(savedProvenance!.sop_wi_updates.value));
      setApprovalRouting(linesToText(savedProvenance!.approval_routing.value));
      setImplementationPlan(
        savedProvenance!.implementation_plan.value as string,
      );
      setRollbackPlan(
        savedProvenance!.rollback_contingency_plan.value as string,
      );
    } else {
      setRequiredActions(linesToText(implementationParsed.required_actions));
      setSopWiUpdates(linesToText(implementationParsed.sop_wi_updates));
      setApprovalRouting(linesToText(implementationParsed.approval_routing));
      setImplementationPlan(implementationParsed.implementation_plan);
      setRollbackPlan(implementationParsed.rollback_contingency_plan);
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

  const confidenceScore = implementationParsed?.confidence_score ?? 0;
  const riskLevel = riskParsed
    ? `${riskParsed.data_integrity_risk.level === "High" || riskParsed.patient_safety_product_quality_impact.level === "High" || riskParsed.regulatory_impact.level === "High" || riskParsed.operational_disruption_risk.level === "High" ? "High" : riskParsed.data_integrity_risk.level === "Moderate" || riskParsed.patient_safety_product_quality_impact.level === "Moderate" || riskParsed.regulatory_impact.level === "Moderate" || riskParsed.operational_disruption_risk.level === "Moderate" ? "Moderate" : "Low"} Risk`
    : null;

  return {
    navigate,
    chatOpen,
    setChatOpen,

    result,
    classificationParsed,
    implementationParsed,

    isGenerating,
    generateError,

    isOverrideEditing,
    overrideConfirmed,
    implementationAccepted,

    requiredActions,
    setRequiredActions,
    sopWiUpdates,
    setSopWiUpdates,
    approvalRouting,
    setApprovalRouting,
    implementationPlan,
    setImplementationPlan,
    rollbackPlan,
    setRollbackPlan,

    showOverrideDialog,
    setShowOverrideDialog,
    overrideJustification,
    setOverrideJustification,
    showRejectDialog,
    setShowRejectDialog,
    rejectJustification,
    setRejectJustification,

    decisionMade,
    confidenceScore,
    riskLevel,

    proceed,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}