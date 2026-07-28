import { apiFetch } from "../utils/api";
import type { AnyCase } from "../types/Records";

export interface ApprovalsListResponse {
  data: AnyCase[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch ALL cases (both types), optionally filtered by approval status.
 * The Approvals page shows every case; per-row gating decides who may
 * actually approve. Reuses the same combined /api/records endpoint.
 */
export const fetchApprovals = async (
  approvalStatus: "all" | "pending" | "approved" = "all",
): Promise<ApprovalsListResponse> => {
  const params = new URLSearchParams({
    pageSize: "100",
    sortField: "created_at",
    sortDir: "desc",
  });
  if (approvalStatus !== "all") params.set("approvalStatus", approvalStatus);

  return apiFetch(`/api/records?${params.toString()}`);
};

/** Full pipeline detail for a single case (used by the edit modal). */
export const fetchApprovalDetail = async (
  id: string,
  caseType: "Deviation" | "Change Control",
): Promise<AnyCase> => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}?case_type=${encodeURIComponent(caseType)}`,
  );
};

export interface ApprovePayload {
  approved_by: string;
  /** Role of the user performing the approval — lets the backend allow
   *  Admins to approve cases submitted to someone else. */
  approver_role: string;
  /** Partial edited sections — only the keys present are overwritten. */
  updates: Record<string, unknown>;
}

/** Apply the approver's edits and flip approval_status to 'approved'. */
export const approveCase = async (
  id: string,
  caseType: "Deviation" | "Change Control",
  payload: ApprovePayload,
) => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}/approve?case_type=${encodeURIComponent(caseType)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
};
