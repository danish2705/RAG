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
