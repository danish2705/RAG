import { useSyncExternalStore } from "react";
import type { PipelineResult } from "../types/pipeline";

interface WorkflowState {
  /** The live pipeline result being built step-by-step. */
  pipelineResult: PipelineResult | null;

  /** ISO timestamp of when the form was submitted, for display purposes. */
  submittedAt: string | null;

  /** Replace the entire result (called after each API stage completes). */
  setPipelineResult: (result: PipelineResult) => void;

  /** Convenience helper: merge partial stage/provenance data into the result. */
  mergePipelineResult: (partial: Partial<PipelineResult>) => void;

  /** Call this when the workflow completes (Summary page save). */
  clearWorkflow: () => void;
}

const listeners = new Set<() => void>();
let store: WorkflowState;

const notifyListeners = () => listeners.forEach((listener) => listener());
const updateStore = (nextStore: WorkflowState) => {
  store = nextStore;
  notifyListeners();
};

const setPipelineResult = (result: PipelineResult) =>
  updateStore({
    ...store,
    pipelineResult: result,
    submittedAt: new Date().toISOString(),
  });

const mergePipelineResult = (partial: Partial<PipelineResult>) =>
  updateStore({
    ...store,
    pipelineResult: store.pipelineResult
      ? {
          ...store.pipelineResult,
          ...partial,
          stages: {
            ...store.pipelineResult.stages,
            ...(partial.stages ?? {}),
          },
          provenance: {
            ...store.pipelineResult.provenance,
            ...(partial.provenance ?? {}),
          },
        }
      : null,
  });

const clearWorkflow = () =>
  updateStore({
    ...store,
    pipelineResult: null,
    submittedAt: null,
  });

store = {
  pipelineResult: null,
  submittedAt: null,
  setPipelineResult,
  mergePipelineResult,
  clearWorkflow,
};

export const useWorkflowStore = <Selected>(selector: (state: WorkflowState) => Selected) =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(store),
    () => selector(store),
  );
