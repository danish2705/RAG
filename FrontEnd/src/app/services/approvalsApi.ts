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

export interface RejectPayload {
  rejected_by: string;
  approver_role: string;
  reason?: string;
}

/** Send the case back to the submitter with a reason instead of approving it. */
export const rejectCase = async (
  id: string,
  caseType: "Deviation" | "Change Control",
  payload: RejectPayload,
) => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}/reject?case_type=${encodeURIComponent(caseType)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
};

/** Best-effort ping to mark a pending case as "in review" once the approver
 *  opens it — purely for workflow-status visibility. */
export const startReview = async (
  id: string,
  caseType: "Deviation" | "Change Control",
) => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}/start-review?case_type=${encodeURIComponent(caseType)}`,
    { method: "PATCH" },
  );
};

export interface ResubmitPayload {
  resubmitted_by: string;
  approver_role: string;
  /** Optional: re-target a different approver on resubmit. */
  submitted_to?: string;
  updates: Record<string, unknown>;
}

/** The original submitter edits a rejected case and sends it back for
 *  approval — flips approval_status back to 'pending'. */
export const resubmitCase = async (
  id: string,
  caseType: "Deviation" | "Change Control",
  payload: ResubmitPayload,
) => {
  return apiFetch(
    `/api/records/${encodeURIComponent(id)}/resubmit?case_type=${encodeURIComponent(caseType)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
};

/** Names that can be picked in the "Submit for Approval" dropdown. */
export const fetchApprovers = async (): Promise<string[]> => {
  const result = await apiFetch<{ data: string[] }>("/api/approvers");
  return result.data ?? [];
};
