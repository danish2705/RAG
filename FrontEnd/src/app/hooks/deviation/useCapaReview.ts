import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import {
  aiField,
  markModified,
  type CAPAProvenance,
} from "../../types/dataProvenance";
import type { CAPAResult } from "../../types/pipeline";
import { useOverrideDialogState } from "../shared/useOverRideDialogState";

// ---------------------------------------------------------------------------
// Form reducer: the 4 editable CAPA fields, previously 4 separate useState
// calls with duplicated initializer logic (wasModified ? ... : ...) for each.
// ---------------------------------------------------------------------------
interface CapaFormState {
  correctiveAction: string;
  preventiveAction: string;
  effectivenessCheck: string;
  dueDate: string;
}

type CapaFormAction =
  | { type: "SET_CORRECTIVE_ACTION"; value: string }
  | { type: "SET_PREVENTIVE_ACTION"; value: string }
  | { type: "SET_EFFECTIVENESS_CHECK"; value: string }
  | { type: "SET_DUE_DATE"; value: string }
  | {
      type: "RESTORE";
      correctiveAction: string;
      preventiveAction: string;
      effectivenessCheck: string;
      dueDate: string;
    };

function capaFormReducer(
  state: CapaFormState,
  action: CapaFormAction,
): CapaFormState {
  switch (action.type) {
    case "SET_CORRECTIVE_ACTION":
      return { ...state, correctiveAction: action.value };
    case "SET_PREVENTIVE_ACTION":
      return { ...state, preventiveAction: action.value };
    case "SET_EFFECTIVENESS_CHECK":
      return { ...state, effectivenessCheck: action.value };
    case "SET_DUE_DATE":
      return { ...state, dueDate: action.value };
    case "RESTORE":
      return {
        correctiveAction: action.correctiveAction,
        preventiveAction: action.preventiveAction,
        effectivenessCheck: action.effectivenessCheck,
        dueDate: action.dueDate,
      };
    default:
      return state;
  }
}

export function useCapaReview() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const result = useWorkflowStore((s) => s.pipelineResult);
  const mergePipelineResult = useWorkflowStore((s) => s.mergePipelineResult);

  const capaParsed = result?.stages?.capa?.parsed ?? null;
  const savedCapaProvenance = result?.provenance?.capa;

  const wasModified =
    savedCapaProvenance?.corrective_actions?.source === "modified" ||
    savedCapaProvenance?.preventive_actions?.source === "modified" ||
    savedCapaProvenance?.effectiveness_check?.source === "modified" ||
    savedCapaProvenance?.due_date?.source === "modified";

  const override = useOverrideDialogState();
  const [capaAccepted, setCapaAccepted] = useState(false);
  const [correction, setCorrection] = useState("");
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

  const [form, dispatchForm] = useReducer(capaFormReducer, {
    correctiveAction: wasModified
      ? (savedCapaProvenance!.corrective_actions.value as string[]).join("\n")
      : (capaParsed?.corrective_actions ?? []).join("\n"),
    preventiveAction: wasModified
      ? (savedCapaProvenance!.preventive_actions.value as string[]).join("\n")
      : (capaParsed?.preventive_actions ?? []).join("\n"),
    effectivenessCheck: wasModified
      ? (savedCapaProvenance!.effectiveness_check.value as string)
      : (capaParsed?.effectiveness_check ?? ""),
    dueDate: wasModified
      ? (savedCapaProvenance!.due_date.value as string)
      : (capaParsed?.due_date ?? ""),
  });

  // Mirrors the old `useState(wasModified)` initializer for overrideConfirmed.
  const didInitOverrideConfirmed = useRef(false);
  useEffect(() => {
    if (!didInitOverrideConfirmed.current && wasModified) {
      override.setOverrideConfirmed(true);
      didInitOverrideConfirmed.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasModified]);

  const decisionMade =
    capaAccepted || override.isOverrideEditing || override.overrideConfirmed;

  const setCorrectiveAction = useCallback(
    (value: string) => dispatchForm({ type: "SET_CORRECTIVE_ACTION", value }),
    [],
  );
  const setPreventiveAction = useCallback(
    (value: string) => dispatchForm({ type: "SET_PREVENTIVE_ACTION", value }),
    [],
  );
  const setEffectivenessCheck = useCallback(
    (value: string) => dispatchForm({ type: "SET_EFFECTIVENESS_CHECK", value }),
    [],
  );
  const setDueDate = useCallback(
    (value: string) => dispatchForm({ type: "SET_DUE_DATE", value }),
    [],
  );

  const handleCorrectiveActionChange = useCallback(
    (value: string) => {
      setCorrectiveAction(value);
      if (override.isOverrideEditing) {
        setShowWeakCapaWarning(value.length > 0 && value.length < 50);
      }
    },
    [override.isOverrideEditing, setCorrectiveAction],
  );

  const buildCAPAProvenance = (confirmed: boolean): CAPAProvenance => {
    if (!capaParsed) return {} as CAPAProvenance;

    const curCorrectiveActions = form.correctiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const curPreventiveActions = form.preventiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      capa_required: capaParsed.capa_required,
      confidence_score: capaParsed.confidence_score,
      corrective_actions:
        confirmed &&
        JSON.stringify(curCorrectiveActions) !==
          JSON.stringify(capaParsed.corrective_actions)
          ? markModified(
              aiField(capaParsed.corrective_actions),
              curCorrectiveActions,
            )
          : aiField(capaParsed.corrective_actions),
      preventive_actions:
        confirmed &&
        JSON.stringify(curPreventiveActions) !==
          JSON.stringify(capaParsed.preventive_actions)
          ? markModified(
              aiField(capaParsed.preventive_actions),
              curPreventiveActions,
            )
          : aiField(capaParsed.preventive_actions),
      effectiveness_check:
        confirmed && form.effectivenessCheck !== capaParsed.effectiveness_check
          ? markModified(
              aiField(capaParsed.effectiveness_check),
              form.effectivenessCheck,
            )
          : aiField(capaParsed.effectiveness_check),
      due_date:
        confirmed && form.dueDate !== capaParsed.due_date
          ? markModified(aiField(capaParsed.due_date), form.dueDate)
          : aiField(capaParsed.due_date),
    };
  };

  const buildApprovedCAPA = (): CAPAResult => ({
    ...capaParsed!,
    corrective_actions: form.correctiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    preventive_actions: form.preventiveAction
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    effectiveness_check: form.effectivenessCheck,
    due_date: form.dueDate,
  });

  const proceed = () => {
    if (!result) return;
    const capaProvenance = buildCAPAProvenance(override.overrideConfirmed);
    mergePipelineResult({
      stages: {
        ...result.stages,
        capa: { ...result.stages.capa!, parsed: buildApprovedCAPA() },
      },
      correction,
      provenance: { ...result.provenance, capa: capaProvenance },
    });
    navigate("/deviation/summary");
  };

  const handleCancelOverride = () => {
    if (!capaParsed) return;
    if (wasModified && savedCapaProvenance) {
      dispatchForm({
        type: "RESTORE",
        correctiveAction: (
          savedCapaProvenance.corrective_actions.value as string[]
        ).join("\n"),
        preventiveAction: (
          savedCapaProvenance.preventive_actions.value as string[]
        ).join("\n"),
        effectivenessCheck: savedCapaProvenance.effectiveness_check
          .value as string,
        dueDate: savedCapaProvenance.due_date.value as string,
      });
    } else {
      dispatchForm({
        type: "RESTORE",
        correctiveAction: (capaParsed.corrective_actions ?? []).join("\n"),
        preventiveAction: (capaParsed.preventive_actions ?? []).join("\n"),
        effectivenessCheck: capaParsed.effectiveness_check ?? "",
        dueDate: capaParsed.due_date ?? "",
      });
    }
    setShowWeakCapaWarning(false);
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

  return {
    result,
    capaParsed,
    chatOpen,
    setChatOpen,
    isOverrideEditing: override.isOverrideEditing,
    setIsOverrideEditing: override.setIsOverrideEditing,
    overrideConfirmed: override.overrideConfirmed,
    capaAccepted,
    setCapaAccepted,
    correction,
    setCorrection,
    correctiveAction: form.correctiveAction,
    handleCorrectiveActionChange,
    preventiveAction: form.preventiveAction,
    setPreventiveAction,
    effectivenessCheck: form.effectivenessCheck,
    setEffectivenessCheck,
    dueDate: form.dueDate,
    setDueDate,
    showWeakCapaWarning,
    decisionMade,
    showOverrideDialog: override.showOverrideDialog,
    setShowOverrideDialog: override.setShowOverrideDialog,
    overrideJustification: override.overrideJustification,
    setOverrideJustification: override.setOverrideJustification,
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,
    proceed,
    handleCancelOverride,
    handleOverrideConfirm,
    handleReject,
  };
}
