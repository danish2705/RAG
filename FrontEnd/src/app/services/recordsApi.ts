import { apiFetch } from "../utils/api";
import type { AnyCase } from "../types/Records";

export interface RecordsListResponse {
  data: AnyCase[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const fetchRecords = async (): Promise<RecordsListResponse> => {
  return apiFetch(
    `/api/records?pageSize=100&sortField=created_at&sortDir=desc`,
  );
};

export const fetchCaseDetail = async (
  id: string,
  caseType: "Deviation" | "Change Control",
): Promise<AnyCase> => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}?case_type=${encodeURIComponent(caseType)}`,
  );
};

export interface SimilarQueryMatch {
  id: number | string;
  case_type: "Deviation" | "Change Control";
  classification: string | null;
  saved_by: string | null;
  created_at: string;
  query: string;
  description: string;
  similarity: number;
}

export interface SimilarQueryResponse {
  hasSimilar: boolean;
  matches: SimilarQueryMatch[];
}

// Checks whether a description looks like something already submitted.
// Called from the New Deviation/Change Control intake form right before it
// submits for AI analysis.
export const checkSimilarQuery = async (
  description: string,
): Promise<SimilarQueryResponse> => {
  return apiFetch(`/api/cases/check-similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
};
