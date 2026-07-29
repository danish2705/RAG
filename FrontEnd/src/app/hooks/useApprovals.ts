import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchApprovals,
  fetchApprovalDetail,
  approveCase,
  rejectCase,
  startReview,
  type ApprovePayload,
  type RejectPayload,
} from "../services/approvalsApi";
import type { AnyCase, ApprovalStatus } from "../types/Records";

interface ApprovalRow {
  uiId: string;
  id: string;
  submittedBy: string;
  submittedTo: string;
  query: string;
  classification: "Deviation" | "Change Control";
  savedOn: string;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  rejectedBy: string | null;
  approvedBy: string | null;
  raw: AnyCase;
}

function toApprovalRow(row: any): ApprovalRow {
  return {
    uiId: `#${String(row.id).slice(0, 8)}`,
    id: String(row.id),
    submittedBy: row.saved_by || "N/A",
    submittedTo: row.submitted_to || "N/A",
    query: row.query || "",
    classification: row.case_type,
    savedOn: row.created_at,
    approvalStatus: (row.approval_status as ApprovalStatus) || "pending",
    rejectionReason: row.rejection_reason ?? null,
    rejectedBy: row.rejected_by ?? null,
    approvedBy: row.approved_by ?? null,
    raw: row,
  };
}

export function useApprovals() {
  const { user } = useAuth();
  // The identity the user is "logged in as" — same rule the save flow uses to
  // set saved_by, so it lines up with submitted_to written by other users.
  const identity = (user?.displayName || user?.username || "").trim();
  const isAdmin = user?.role === "Admin";

  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [submittedToFilter, setSubmittedToFilter] = useState("all");

  // Selected case + its full detail (fetched on demand for the edit modal).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AnyCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApprovals("all");
      setRows(result.data.map(toApprovalRow));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load approvals.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Visibility gate: a case submitted for approval should only be visible
  // to the approver it was assigned to (or an Admin, for oversight) — not
  // to every other user who happens to open the Approvals page.
  const visibleRows = useMemo(() => {
    if (isAdmin) return rows;
    if (!identity) return [];
    return rows.filter(
      (r) => r.submittedTo.toLowerCase() === identity.toLowerCase(),
    );
  }, [rows, identity, isAdmin]);

  // Distinct names for the "submitted to" dropdown, taken from whatever the
  // current user is allowed to see (so a non-Admin never sees other
  // approvers' names leak into the filter).
  const submittedToOptions = useMemo(
    () =>
      Array.from(
        new Set(visibleRows.map((r) => r.submittedTo).filter(Boolean)),
      ).sort(),
    [visibleRows],
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return visibleRows.filter((r) => {
      // Once a case is approved, or rejected (the ball is back in the
      // submitter's court), it drops off the approver's active queue.
      if (r.approvalStatus === "approved" || r.approvalStatus === "rejected")
        return false;
      if (submittedToFilter !== "all" && r.submittedTo !== submittedToFilter)
        return false;
      if (
        q &&
        !r.submittedBy.toLowerCase().includes(q) &&
        !r.query.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [visibleRows, searchText, submittedToFilter]);

  // True when the current user is the approver this case was submitted to,
  // or when they're an Admin (Admins can approve any pending case).
  const canApprove = useCallback(
    (row: ApprovalRow) =>
      isAdmin ||
      (!!identity && row.submittedTo.toLowerCase() === identity.toLowerCase()),
    [identity, isAdmin],
  );

  const openCase = useCallback(
    (row: ApprovalRow) => {
      setSelectedId(row.id);
      setSelectedDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      fetchApprovalDetail(row.id, row.classification)
        .then(setSelectedDetail)
        .catch((err) =>
          setDetailError(
            err instanceof Error ? err.message : "Failed to load case detail.",
          ),
        )
        .finally(() => setDetailLoading(false));

      // Best-effort: mark the case "in review" now that the approver has
      // opened it, purely for lifecycle visibility. Ignored if it fails.
      if (row.approvalStatus === "pending" && canApprove(row)) {
        startReview(row.id, row.classification)
          .then(() => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, approvalStatus: "in_review" } : r,
              ),
            );
          })
          .catch(() => {});
      }
    },
    [canApprove],
  );

  const closeCase = useCallback(() => {
    setSelectedId(null);
    setSelectedDetail(null);
    setDetailError(null);
    setApproveError(null);
    setRejectError(null);
  }, []);

  // Persist the approver's edits + flip to approved. Errors are surfaced
  // instead of failing silently. Stays on the Approvals page (the case
  // simply drops off the active queue) and refreshes the list.
  const submitApproval = useCallback(
    async (
      id: string,
      caseType: "Deviation" | "Change Control",
      updates: Record<string, unknown>,
    ) => {
      setIsApproving(true);
      setApproveError(null);
      try {
        const payload: ApprovePayload = {
          approved_by: identity || "Unknown",
          approver_role: user?.role || "User",
          updates,
        };
        await approveCase(id, caseType, payload);
        closeCase();
        await load();
      } catch (err) {
        setApproveError(
          err instanceof Error
            ? err.message
            : "Could not save the approval. Please try again.",
        );
      } finally {
        setIsApproving(false);
      }
    },
    [identity, user, closeCase, load],
  );

  // Reject: sends the case back to the submitter with a reason instead of
  // approving it, so they can correct it and resubmit from the Records page.
  const submitRejection = useCallback(
    async (
      id: string,
      caseType: "Deviation" | "Change Control",
      reason: string,
    ) => {
      setIsRejecting(true);
      setRejectError(null);
      try {
        const payload: RejectPayload = {
          rejected_by: identity || "Unknown",
          approver_role: user?.role || "User",
          reason,
        };
        await rejectCase(id, caseType, payload);
        closeCase();
        await load();
      } catch (err) {
        setRejectError(
          err instanceof Error
            ? err.message
            : "Could not reject the case. Please try again.",
        );
      } finally {
        setIsRejecting(false);
      }
    },
    [identity, user, closeCase, load],
  );

  return {
    identity,
    rows: filteredRows,
    allRows: rows,
    loading,
    error,
    searchText,
    setSearchText,
    submittedToFilter,
    setSubmittedToFilter,
    submittedToOptions,
    selectedId,
    selectedDetail,
    detailLoading,
    detailError,
    isApproving,
    approveError,
    isRejecting,
    rejectError,
    canApprove,
    openCase,
    closeCase,
    submitApproval,
    submitRejection,
    refetch: load,
  };
}
