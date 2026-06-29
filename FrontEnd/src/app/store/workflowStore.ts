// ── workflowStore.ts ──────────────────────────────────────────────────────────
// Global store for the multi-step deviation workflow.
//
// WHY: Previously each page received `PipelineResult` via React Router's
// `location.state`. That breaks on page refresh, direct URL access, or browser
// back+forward navigation. This store survives all of those within the session.
//
// USAGE:
//   Write  → const set = useWorkflowStore(s => s.setPipelineResult);
//   Read   → const result = useWorkflowStore(s => s.pipelineResult);
//   Clear  → const clear = useWorkflowStore(s => s.clearWorkflow);  (call on Summary save)

import { create } from "zustand";
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

export const useWorkflowStore = create<WorkflowState>((set) => ({
  pipelineResult: null,
  submittedAt: null,

  setPipelineResult: (result) =>
    set({ pipelineResult: result, submittedAt: new Date().toISOString() }),

  mergePipelineResult: (partial) =>
    set((state) => ({
      pipelineResult: state.pipelineResult
        ? {
            ...state.pipelineResult,
            ...partial,
            stages: {
              ...state.pipelineResult.stages,
              ...(partial.stages ?? {}),
            },
            provenance: {
              ...state.pipelineResult.provenance,
              ...(partial.provenance ?? {}),
            },
          }
        : null,
    })),

  clearWorkflow: () => set({ pipelineResult: null, submittedAt: null }),
}));
