import { useCallback, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { autoField, type CAPAProvenance } from "../../types/dataProvenance";
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
  | { type: "SET_DUE_DATE"; value: string };

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

  // Fields are directly editable at all times — seeded from a previously
  // saved edit (if resuming) or the raw AI output, but freely changeable
  // without first entering any separate "override" mode.
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

  // Disables the Accept/Reject buttons once a decision has been made, to
  // avoid double-navigating while the page transitions to the summary.
  const decisionMade = capaAccepted;

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
      setShowWeakCapaWarning(value.length > 0 && value.length < 50);
    },
    [setCorrectiveAction],
  );

  const buildCAPAProvenance = (): CAPAProvenance => {
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
      corrective_actions: autoField(
        capaParsed.corrective_actions,
        curCorrectiveActions,
      ),
      preventive_actions: autoField(
        capaParsed.preventive_actions,
        curPreventiveActions,
      ),
      effectiveness_check: autoField(
        capaParsed.effectiveness_check,
        form.effectivenessCheck,
      ),
      due_date: autoField(capaParsed.due_date, form.dueDate),
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
    const capaProvenance = buildCAPAProvenance();
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

  // Accepting the CAPA is the final decision for the deviation flow, so it
  // advances straight to the summary (no extra "Get Summary" button).
  // Whatever is currently in the form — edited or left as the AI suggested
  // it — is what gets approved.
  const handleAccept = () => {
    setCapaAccepted(true);
    proceed();
  };

  const handleReject = () => {
    if (override.rejectJustification.trim()) {
      override.setShowRejectDialog(false);
      override.setRejectJustification("");
      // Clear the AI-classified fields — the user rejected the AI's
      // suggestion, so we don't leave it sitting in the form. They can
      // either fill this in manually or pull the AI suggestion back in
      // with the button at the top of the page. The Correction field is
      // user-entered (not AI-classified), so it's left untouched.
      setCorrectiveAction("");
      setPreventiveAction("");
      setEffectivenessCheck("");
      setDueDate("");
      setShowWeakCapaWarning(false);
    }
  };

  // Restores the original AI suggestion into the form — used by the
  // "AI Suggestion" button so a rejected/cleared field can be brought back.
  const handleGetAiSuggestion = () => {
    if (!capaParsed) return;
    setCorrectiveAction((capaParsed.corrective_actions ?? []).join("\n"));
    setPreventiveAction((capaParsed.preventive_actions ?? []).join("\n"));
    setEffectivenessCheck(capaParsed.effectiveness_check ?? "");
    setDueDate(capaParsed.due_date ?? "");
    setShowWeakCapaWarning(false);
  };

  return {
    result,
    capaParsed,
    chatOpen,
    setChatOpen,
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
    showRejectDialog: override.showRejectDialog,
    setShowRejectDialog: override.setShowRejectDialog,
    rejectJustification: override.rejectJustification,
    setRejectJustification: override.setRejectJustification,
    proceed,
    handleAccept,
    handleReject,
    handleGetAiSuggestion,
  };
}
