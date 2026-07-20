import { useCallback, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveLlmFailure } from "../../services/llmRetryApi";
import type {
  LlmRetryEntityType,
  LlmRetryStage,
} from "../../services/llmRetryApi";

export interface LlmFailureContext {
  entityType: LlmRetryEntityType;
  pipelineStage: LlmRetryStage;
  queryText: string;
  errorMessage?: string | null;
  // The in-progress PipelineResult (workflowStore) at the moment of
  // failure — undefined/null for the very first stage (classification),
  // since nothing exists in the store yet at that point. This is what lets
  // "Resume" on the Pending AI Reviews page put the user right back where
  // they left off instead of starting over.
  pipelineContext?: unknown;
}

/**
 * Drop this into any hook that calls the AI pipeline. When a call fails
 * (LLM down, timeout, 5xx, etc.), call `openLlmFailureDialog({...})` from
 * the catch block instead of — or in addition to — showing an inline error.
 * It captures the user's name, saves the in-progress query to
 * llm_retry_queue (visible later on the "Pending AI Reviews" page), and
 * shows the 5-digit reference code back to them.
 *
 * Render <LlmFailureDialog control={llmFailure} /> once per page that uses
 * this hook.
 */
export function useLlmFailureRecovery() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<LlmFailureContext | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedReferenceCode, setSavedReferenceCode] = useState<string | null>(
    null,
  );

  const openLlmFailureDialog = useCallback(
    (ctx: LlmFailureContext) => {
      setContext(ctx);
      setName(user?.username ?? "");
      setNameError("");
      setSaveError(null);
      setSavedReferenceCode(null);
      setIsOpen(true);
    },
    [user],
  );

  const closeLlmFailureDialog = useCallback(() => {
    setIsOpen(false);
    setContext(null);
    setSavedReferenceCode(null);
  }, []);

  const submitLlmFailure = useCallback(async () => {
    if (!name.trim()) {
      setNameError("Please enter your name before saving.");
      return;
    }
    if (!context) return;

    setNameError("");
    setSaveError(null);
    setIsSaving(true);

    try {
      const entry = await saveLlmFailure({
        full_name: name.trim(),
        entity_type: context.entityType,
        pipeline_stage: context.pipelineStage,
        query_text: context.queryText,
        error_message: context.errorMessage ?? null,
        pipeline_context: context.pipelineContext ?? null,
      });
      setSavedReferenceCode(entry.reference_code);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong saving this for later. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [name, context]);

  return {
    isOpen,
    openLlmFailureDialog,
    closeLlmFailureDialog,
    name,
    setName,
    nameError,
    isSaving,
    saveError,
    savedReferenceCode,
    submitLlmFailure,
  };
}

export type LlmFailureRecoveryControl = ReturnType<
  typeof useLlmFailureRecovery
>;
