import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  listLlmRetryEntries,
  getLlmRetryEntry,
  updateLlmRetryStatus,
  deleteLlmRetryEntry,
} from "../services/llmRetryApi";
import type {
  LlmRetryEntry,
  LlmRetryStatus,
  LlmRetryEntityType,
  LlmRetryStage,
} from "../services/llmRetryApi";
import { useWorkflowStore } from "../store/workflowStore";
import { apiFetch } from "../utils/api";
import type { PipelineResult } from "../types/pipeline";

// Where "Resume" sends the user for each failed stage — the page whose
// Accept button re-triggers that exact AI call. Classification is handled
// separately below since no pipeline exists in the store yet at that stage.
const RESUME_ROUTE: Record<Exclude<LlmRetryStage, "classification">, string> = {
  impact_assessment: "/deviation/ai-recommendation",
  change_impact_assessment: "/deviation/ai-recommendation",
  rca: "/deviation/impact-assessment",
  capa: "/deviation/root-cause",
  risk_criticality: "/change-control/change-impact-assessment",
  validation_testing: "/change-control/risk-criticality",
  // This page auto-retries generation on load when the stage is missing,
  // so landing here directly re-runs the failed call automatically.
  implementation_control: "/change-control/implementation",
  final_summary: "/change-control/summary",
};

export function usePendingAiReviews() {
  const [entries, setEntries] = useState<LlmRetryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<LlmRetryStatus | "all">(
    "all",
  );
  const [entityTypeFilter, setEntityTypeFilter] = useState<
    LlmRetryEntityType | "all"
  >("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tracks which row id is mid-update so its toggle can show a spinner
  // without freezing the whole table.
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Resume flow state — separate from updatingId since a row could
  // theoretically have both in flight (not simultaneously in practice,
  // but keeping them independent avoids one action disabling the other).
  const [resumingId, setResumingId] = useState<number | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Delete flow state — tracks which row id is mid-delete for its spinner.
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setPipelineResult = useWorkflowStore((s) => s.setPipelineResult);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listLlmRetryEntries({
        page,
        pageSize: 25,
        status: statusFilter,
        entityType: entityTypeFilter,
        search: search || undefined,
      });
      setEntries(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load pending AI reviews.",
      );
      setEntries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, entityTypeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = useCallback(async (entry: LlmRetryEntry) => {
    const nextStatus: LlmRetryStatus =
      entry.status === "pending" ? "not_executed" : "pending";

    setUpdatingId(entry.id);
    // Optimistic update — reverted if the request fails.
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, status: nextStatus } : e)),
    );

    try {
      await updateLlmRetryStatus(entry.id, nextStatus);
    } catch (err) {
      // Roll back on failure.
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: entry.status } : e,
        ),
      );
      setError(
        err instanceof Error
          ? err.message
          : "Could not update status. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleResume = useCallback(
    async (entry: LlmRetryEntry) => {
      setResumeError(null);
      setResumingId(entry.id);

      try {
        const full = await getLlmRetryEntry(entry.id);

        if (full.pipeline_stage === "classification") {
          // No pipeline exists yet at this stage — resuming means simply
          // re-running the original classification call with the same
          // query text.
          const result: PipelineResult = await apiFetch("/api/inputQuery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: full.query_text }),
          });
          setPipelineResult(result);
          navigate("/deviation/ai-recommendation");
          return;
        }

        if (!full.pipeline_context) {
          setResumeError(
            "This entry was saved before progress-tracking was added, so there's nothing to resume automatically. Please start over from Quality Event Intake with the same details.",
          );
          return;
        }

        setPipelineResult(full.pipeline_context as PipelineResult);
        navigate(RESUME_ROUTE[full.pipeline_stage]);
      } catch (err) {
        setResumeError(
          err instanceof Error
            ? err.message
            : "Something went wrong resuming this entry. Please try again.",
        );
      } finally {
        setResumingId(null);
      }
    },
    [navigate, setPipelineResult],
  );

  const handleDelete = useCallback(
    async (entry: LlmRetryEntry) => {
      setDeleteError(null);
      setDeletingId(entry.id);

      // Optimistic removal — restored if the request fails.
      const previous = entries;
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));

      try {
        await deleteLlmRetryEntry(entry.id);
      } catch (err) {
        setEntries(previous);
        setDeleteError(
          err instanceof Error
            ? err.message
            : "Could not delete this entry. Please try again.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [entries],
  );

  return {
    entries,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    entityTypeFilter,
    setEntityTypeFilter,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    updatingId,
    toggleStatus,
    resumingId,
    resumeError,
    handleResume,
    deletingId,
    deleteError,
    handleDelete,
    refetch: load,
  };
}