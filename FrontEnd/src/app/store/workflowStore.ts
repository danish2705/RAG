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

// The store previously lived in a plain module-level variable only, which
// meant a browser refresh (or opening a change-control/deviation URL
// directly, e.g. from a bookmark or a copied link) wiped pipelineResult
// back to null — the multi-step wizard would then show its "no data found"
// guard on whatever page you landed on, even though you'd already gone
// through intake. Persisting the in-progress result to sessionStorage fixes
// that: it survives refreshes/direct navigation within the same tab, but
// still clears when the tab is closed (so we don't leak data across
// unrelated sessions the way localStorage would).
const STORAGE_KEY = "dnc.workflowState";

interface PersistedWorkflowState {
  pipelineResult: PipelineResult | null;
  submittedAt: string | null;
}

const loadPersistedState = (): PersistedWorkflowState => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { pipelineResult: null, submittedAt: null };
    const parsed = JSON.parse(raw) as PersistedWorkflowState;
    return {
      pipelineResult: parsed.pipelineResult ?? null,
      submittedAt: parsed.submittedAt ?? null,
    };
  } catch {
    // Corrupt/unavailable storage (private browsing, quota, bad JSON, etc.)
    // — fall back to a clean in-memory-only state instead of crashing.
    return { pipelineResult: null, submittedAt: null };
  }
};

const persistState = (state: PersistedWorkflowState) => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pipelineResult: state.pipelineResult,
        submittedAt: state.submittedAt,
      }),
    );
  } catch {
    // Storage may be unavailable/full — the workflow still works for the
    // current in-memory session, it just won't survive a refresh.
  }
};

const listeners = new Set<() => void>();
let store: WorkflowState;

const notifyListeners = () => listeners.forEach((listener) => listener());
const updateStore = (nextStore: WorkflowState) => {
  store = nextStore;
  persistState({
    pipelineResult: nextStore.pipelineResult,
    submittedAt: nextStore.submittedAt,
  });
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

const persisted = loadPersistedState();

store = {
  pipelineResult: persisted.pipelineResult,
  submittedAt: persisted.submittedAt,
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