import { apiFetch } from "../utils/api";

export type LlmRetryEntityType = "Deviation" | "Change Control";
export type LlmRetryStatus = "pending" | "not_executed";
export type LlmRetryStage =
  | "classification"
  | "impact_assessment"
  | "rca"
  | "capa"
  | "change_impact_assessment"
  | "risk_criticality"
  | "validation_testing"
  | "implementation_control"
  | "final_summary";

export interface LlmRetryEntry {
  id: number;
  full_name: string;
  entity_type: LlmRetryEntityType;
  pipeline_stage: LlmRetryStage;
  query_text: string;
  error_message: string | null;
  status: LlmRetryStatus;
  created_at: string;
}

export interface LlmRetryEntryWithContext extends LlmRetryEntry {
  // The saved PipelineResult snapshot from the moment the AI call failed —
  // null for "classification" failures, since no pipeline exists yet then.
  pipeline_context: unknown;
}

export interface SaveLlmFailurePayload {
  full_name: string;
  entity_type: LlmRetryEntityType;
  pipeline_stage: LlmRetryStage;
  query_text: string;
  error_message?: string | null;
  pipeline_context?: unknown;
}

export const saveLlmFailure = async (
  payload: SaveLlmFailurePayload,
): Promise<LlmRetryEntry> => {
  return apiFetch("/api/llm-retry-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export interface ListLlmRetryParams {
  page?: number;
  pageSize?: number;
  status?: LlmRetryStatus | "all";
  entityType?: LlmRetryEntityType | "all";
  search?: string;
}

export interface PaginatedLlmRetry {
  data: LlmRetryEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const listLlmRetryEntries = async (
  params: ListLlmRetryParams = {},
): Promise<PaginatedLlmRetry> => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.entityType) search.set("entityType", params.entityType);
  if (params.search) search.set("search", params.search);

  const qs = search.toString();
  return apiFetch(`/api/llm-retry-queue${qs ? `?${qs}` : ""}`);
};

export const getLlmRetryEntry = async (
  id: number,
): Promise<LlmRetryEntryWithContext> => {
  return apiFetch(`/api/llm-retry-queue/${id}`);
};

export const updateLlmRetryStatus = async (
  id: number,
  status: LlmRetryStatus,
): Promise<LlmRetryEntry> => {
  return apiFetch(`/api/llm-retry-queue/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
};

export const deleteLlmRetryEntry = async (id: number): Promise<void> => {
  return apiFetch(`/api/llm-retry-queue/${id}`, {
    method: "DELETE",
  });
};