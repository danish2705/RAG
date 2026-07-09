import { useState } from "react";
import { useNavigate } from "react-router";
import { useWorkflowStore } from "../../store/workflowStore";
import { aiField, markModified, type CAPAProvenance } from "../../types/dataProvenance";
import type { CAPAResult } from "../../types/pipeline";

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

  const [isOverrideEditing, setIsOverrideEditing] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(wasModified);
  const [capaAccepted, setCapaAccepted] = useState(false);
  const [correction, setCorrection] = useState("");
  
  const [correctiveAction, setCorrectiveAction] = useState(
    wasModified
      ? (savedCapaProvenance!.corrective_actions.value as string[]).join("\n")
      : (capaParsed?.corrective_actions ?? []).join("\n")
  );
  
  const [preventiveAction, setPreventiveAction] = useState(
    wasModified
      ? (savedCapaProvenance!.preventive_actions.value as string[]).join("\n")
      : (capaParsed?.preventive_actions ?? []).join("\n")
  );
  
  const [effectivenessCheck, setEffectivenessCheck] = useState(
    wasModified
      ? (savedCapaProvenance!.effectiveness_check.value as string)
      : (capaParsed?.effectiveness_check ?? "")
  );
  
  const [dueDate, setDueDate] = useState(
    wasModified
      ? (savedCapaProvenance!.due_date.value as string)
      : (capaParsed?.due_date ?? "")
  );
  
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState("");

  const decisionMade = capaAccepted || isOverrideEditing || overrideConfirmed;

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    if (isOverrideEditing) {
      setShowWeakCapaWarning(value.length > 0 && value.length < 50);
    }
  };

  const buildCAPAProvenance = (confirmed: boolean): CAPAProvenance => {
    if (!capaParsed) return {} as CAPAProvenance;

    const curCorrectiveActions = correctiveAction.split("\n").map((s) => s.trim()).filter(Boolean);
    const curPreventiveActions = preventiveAction.split("\n").map((s) => s.trim()).filter(Boolean);

    return {
      capa_required: capaParsed.capa_required,
      confidence_score: capaParsed.confidence_score,
      corrective_actions:
        confirmed && JSON.stringify(curCorrectiveActions) !== JSON.stringify(capaParsed.corrective_actions)
          ? markModified(aiField(capaParsed.corrective_actions), curCorrectiveActions)
          : aiField(capaParsed.corrective_actions),
      preventive_actions:
        confirmed && JSON.stringify(curPreventiveActions) !== JSON.stringify(capaParsed.preventive_actions)
          ? markModified(aiField(capaParsed.preventive_actions), curPreventiveActions)
          : aiField(capaParsed.preventive_actions),
      effectiveness_check:
        confirmed && effectivenessCheck !== capaParsed.effectiveness_check
          ? markModified(aiField(capaParsed.effectiveness_check), effectivenessCheck)
          : aiField(capaParsed.effectiveness_check),
      due_date:
        confirmed && dueDate !== capaParsed.due_date
          ? markModified(aiField(capaParsed.due_date), dueDate)
          : aiField(capaParsed.due_date),
    };
  };

  const buildApprovedCAPA = (): CAPAResult => ({
    ...capaParsed!,
    corrective_actions: correctiveAction.split("\n").map((s) => s.trim()).filter(Boolean),
    preventive_actions: preventiveAction.split("\n").map((s) => s.trim()).filter(Boolean),
    effectiveness_check: effectivenessCheck,
    due_date: dueDate,
  });

  const proceed = () => {
    if (!result) return;
    const capaProvenance = buildCAPAProvenance(overrideConfirmed);
    mergePipelineResult({
      stages: { ...result.stages, capa: { ...result.stages.capa!, parsed: buildApprovedCAPA() } },
      correction,
      provenance: { ...result.provenance, capa: capaProvenance },
    });
    navigate("/deviation/summary");
  };

  const handleCancelOverride = () => {
    if (!capaParsed) return;
    if (wasModified && savedCapaProvenance) {
      setCorrectiveAction((savedCapaProvenance.corrective_actions.value as string[]).join("\n"));
      setPreventiveAction((savedCapaProvenance.preventive_actions.value as string[]).join("\n"));
      setEffectivenessCheck(savedCapaProvenance.effectiveness_check.value as string);
      setDueDate(savedCapaProvenance.due_date.value as string);
    } else {
      setCorrectiveAction((capaParsed.corrective_actions ?? []).join("\n"));
      setPreventiveAction((capaParsed.preventive_actions ?? []).join("\n"));
      setEffectivenessCheck(capaParsed.effectiveness_check ?? "");
      setDueDate(capaParsed.due_date ?? "");
    }
    setShowWeakCapaWarning(false);
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
    result, capaParsed, chatOpen, setChatOpen,
    isOverrideEditing, setIsOverrideEditing, overrideConfirmed, capaAccepted, setCapaAccepted,
    correction, setCorrection, correctiveAction, handleCorrectiveActionChange,
    preventiveAction, setPreventiveAction, effectivenessCheck, setEffectivenessCheck,
    dueDate, setDueDate, showWeakCapaWarning, decisionMade,
    showOverrideDialog, setShowOverrideDialog, overrideJustification, setOverrideJustification,
    showRejectDialog, setShowRejectDialog, rejectJustification, setRejectJustification,
    proceed, handleCancelOverride, handleOverrideConfirm, handleReject
  };
}