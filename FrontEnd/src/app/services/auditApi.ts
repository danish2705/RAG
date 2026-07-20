import { apiFetch } from "../utils/api";
import type {
  AuditListResponse,
  AuditAction,
  AuditSource,
} from "../types/audit";

export interface FetchAuditParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  source?: AuditSource | "all";
  action?: AuditAction | "all";
  entityId?: string;
  search?: string;
}

export const fetchAuditLog = async (
  params: FetchAuditParams = {},
): Promise<AuditListResponse> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return apiFetch(`/api/audit${qs ? `?${qs}` : ""}`);
};
