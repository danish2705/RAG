import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { generateImplementationControl } from "../../services/changeControl/implementationControlApi";
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
import { useOverrideDialogState } from "../shared/useOverRideDialogState";
import { useLlmFailureRecovery } from "../shared/useLlmFailureRecovery";

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

interface ImplementationFormState {
  requiredActions: string;
  sopWiUpdates: string;
  approvalRouting: string;
  implementationPlan: string;
  rollbackPlan: string;
}

type ImplementationFormAction =
  | { type: "HYDRATE"; parsed: ImplementationControlParsed }
  | {
      type: "HYDRATE_FROM_PROVENANCE";
      requiredActions: string[];
      sopWiUpdates: string[];
      approvalRouting: string[];
      implementationPlan: string;
      rollbackPlan: string;
    }
  | { type: "SET_REQUIRED_ACTIONS"; value: string }
  | { type: "SET_SOP_WI_UPDATES"; value: string }
  | { type: "SET_APPROVAL_ROUTING"; value: string }
  | { type: "SET_IMPLEMENTATION_PLAN"; value: string }
  | { type: "SET_ROLLBACK_PLAN"; value: string };

function hydrateImplementationForm(
  parsed: ImplementationControlParsed,
): ImplementationFormState {
  return {
    requiredActions: linesToText(parsed.required_actions),
    sopWiUpdates: linesToText(parsed.sop_wi_updates),
    approvalRouting: linesToText(parsed.approval_routing),
    implementationPlan: parsed.implementation_plan,
    rollbackPlan: parsed.rollback_contingency_plan,
  };
}

function implementationFormReducer(
  state: ImplementationFormState,
  action: ImplementationFormAction,
): ImplementationFormState {
  switch (action.type) {
    case "HYDRATE":
      return hydrateImplementationForm(action.parsed);
    case "HYDRATE_FROM_PROVENANCE":
      return {
        requiredActions: linesToText(action.requiredActions),
        sopWiUpdates: linesToText(action.sopWiUpdates),
        approvalRouting: linesToText(action.approvalRouting),
        implementationPlan: action.implementationPlan,
        rollbackPlan: action.rollbackPlan,
      };
    case "SET_REQUIRED_ACTIONS":
      return { ...state, requiredActions: action.value };
    case "SET_SOP_WI_UPDATES":
      return { ...state, sopWiUpdates: action.value };
    case "SET_APPROVAL_ROUTING":
      return { ...state, approvalRouting: action.value };
    case "SET_IMPLEMENTATION_PLAN":
      return { ...state, implementationPlan: action.value };
    case "SET_ROLLBACK_PLAN":
      return { ...state, rollbackPlan: action.value };
    default:
      return state;
  }
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
  const llmFailure = useLlmFailureRecovery();

  useEffect(() => {
    if (!result || implementationParsed || isGenerating) return;

    let cancelled = false;
    setIsGenerating(true);
    setGenerateError(null);

    const changeImpactAssessmentParsed =
      result.stages?.changeImpactAssessment?.parsed ?? null;
    const validationTestingParsed =
      result.stages?.validationTesting?.parsed ?? null;

    generateImplementationControl(
      result.query,
      changeImpactAssessmentParsed
        ? nestedToFlatChangeImpactAssessment(changeImpactAssessmentParsed)
        : null,
      result.stages?.riskCriticality?.parsed ?? null,
      validationTestingParsed
        ? nestedToFlatValidationTesting(validationTestingParsed)
        : null,
    )
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
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong generating implementation & control actions. Please try again.";
        setGenerateError(message);
        llmFailure.openLlmFailureDialog({
          entityType: "Change Control",
          pipelineStage: "implementation_control",
          queryText: result.query,
          errorMessage: message,
          pipelineContext: result,
        });
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

  const override = useOverrideDialogState();
  const [implementationAccepted, setImplementationAccepted] = useState(false);

  const [form, dispatchForm] = useReducer(
    implementationFormReducer,
    wasModified
      ? {
          requiredActions: linesToText(savedProvenance!.required_actions.value),
          sopWiUpdates: linesToText(savedProvenance!.sop_wi_updates.value),
          approvalRouting: linesToText(savedProvenance!.approval_routing.value),
          implementationPlan: savedProvenance!.implementation_plan
            .value as string,
          rollbackPlan: savedProvenance!.rollback_contingency_plan
            .value as string,
        }
      : {
          requiredActions: linesToText(
            implementationParsed?.required_actions ?? [],
          ),
          sopWiUpdates: linesToText(implementationParsed?.sop_wi_updates ?? []),
          approvalRouting: linesToText(
            implementationParsed?.approval_routing ?? [],
          ),
          implementationPlan: implementationParsed?.implementation_plan ?? "",
          rollbackPlan: implementationParsed?.rollback_contingency_plan ?? "",
        },
  );

  // Mirrors the old `useState(wasModified)` initializer for overrideConfirmed
  // — sync it once, the first time we know whether this stage was
  // previously modified, without re-running on every render.
  const didInitOverrideConfirmed = useRef(false);
  useEffect(() => {
    if (!didInitOverrideConfirmed.current && wasModified) {
      override.setOverrideConfirmed(true);
      didInitOverrideConfirmed.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasModified]);

  const setRequiredActions = useCallback(
    (value: string) => dispatchForm({ type: "SET_REQUIRED_ACTIONS", value }),
    [],
  );
  const setSopWiUpdates = useCallback(
    (value: string) => dispatchForm({ type: "SET_SOP_WI_UPDATES", value }),
    [],
  );
  const setApprovalRouting = useCallback(
    (value: string) => dispatchForm({ type: "SET_APPROVAL_ROUTING", value }),
    [],
  );
  const setImplementationPlan = useCallback(
    (value: string) => dispatchForm({ type: "SET_IMPLEMENTATION_PLAN", value }),
    [],
  );
  const setRollbackPlan = useCallback(
    (value: string) => dispatchForm({ type: "SET_ROLLBACK_PLAN", value }),
    [],
  );

  // Re-hydrate local editable state whenever a new AI result lands in the
  // store (mirrors the pattern used on RiskCriticality.tsx).
  useEffect(() => {
    if (!implementationParsed) return;
    dispatchForm({ type: "HYDRATE", parsed: implementationParsed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implementationParsed]);

  const decisionMade =
    implementationAccepted ||
    override.isOverrideEditing ||
    override.overrideConfirmed;

  // Provenance + approved result builders
  const buildProvenance = (
    confirmed: boolean,
  ): ImplementationControlProvenance | null => {
    if (!implementationParsed) return null;
    const curRequiredActions = parseLines(form.requiredActions);
    const curSopWiUpdates = parseLines(form.sopWiUpdates);
    const curApprovalRouting = parseLines(form.approvalRouting);

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
        form.implementationPlan !== implementationParsed.implementation_plan
          ? markModified(
              aiField(implementationParsed.implementation_plan),
              form.implementationPlan,
            )
          : aiField(implementationParsed.implementation_plan),
      rollback_contingency_plan:
        confirmed &&
        form.rollbackPlan !== implementationParsed.rollback_contingency_plan
          ? markModified(
              aiField(implementationParsed.rollback_contingency_plan),
              form.rollbackPlan,
            )
          : aiField(implementationParsed.rollback_contingency_plan),
      confidence_score: implementationParsed.confidence_score,
    };
  };

  const buildApprovedImplementation = (): ImplementationControlParsed | null =>
    implementationParsed
      ? {
          ...implementationParsed,
          required_actions: parseLines(form.requiredActions),
          sop_wi_updates: parseLines(form.sopWiUpdates),
          approval_routing: parseLines(form.approvalRouting),
          implementation_plan: form.implementationPlan,
          rollback_contingency_plan: form.rollbackPlan,
        }
      : null;

  const proceed = () => {
    if (!result || !implementationParsed) return;
    const provenance = buildProvenance(override.overrideConfirmed);
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
  const handleOverrideClick = () => override.setIsOverrideEditing(true);
  const handleSaveChanges = () => override.setShowOverrideDialog(true);

  const handleCancelOverride = () => {
    if (!implementationParsed) return;
    if (wasModified) {
      dispatchForm({
        type: "HYDRATE_FROM_PROVENANCE",
        requiredActions: savedProvenance!.required_actions.value,
        sopWiUpdates: savedProvenance!.sop_wi_updates.value,
        approvalRouting: savedProvenance!.approval_routing.value,
        implementationPlan: savedProvenance!.implementation_plan
          .value as string,
        rollbackPlan: savedProvenance!.rollback_contingency_plan
          .value as string,
      });
    } else {
      dispatchForm({ type: "HYDRATE", parsed: implementationParsed });
    }
    override.setIsOverrideEditing(false);
  };

  const handleOverrideConfirm = () => {
    if (!override.overrideJustification.trim()) return;
    override.confirmOverride();
  };

  const handleReject = () => {
    if (override.rejectJustification.trim()) {
      override.setShowRejectDialog(false);
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

    isOverrideEditing: override.isOverrideEditing,
    overrideConfirmed: override.overrideConfirmed,
    implementationAccepted,

    requiredActions: form.requiredActions,
    setRequiredActions,
    sopWiUpdates: form.sopWiUpdates,
    setSopWiUpdates,
    approvalRouting: form.approvalRouting,
    setApprovalRouting,
    implementationPlan: form.implementationPlan,
    setImplementationPlan,
    rollbackPlan: form.rollbackPlan,
    setRollbackPlan,

    showOverrideDialog: override.showOverrideDialog,
    setShowOverrideDialog: override.setShowOverrideDialog,
    overrideJustification: override.overrideJustification,
    setOverrideJustification: override.setOverrideJustification,
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,

    decisionMade,
    confidenceScore,
    riskLevel,
    llmFailure,

    proceed,
    handleAccept,
    handleOverrideClick,
    handleSaveChanges,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}
