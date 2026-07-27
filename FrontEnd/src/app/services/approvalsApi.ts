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

export const fetchApprovals = async (
  submittedTo: string,
  approvalStatus: "all" | "pending" | "approved" = "all",
): Promise<ApprovalsListResponse> => {
  const params = new URLSearchParams({
    pageSize: "100",
    sortField: "created_at",
    sortDir: "desc",
    submittedTo,
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
