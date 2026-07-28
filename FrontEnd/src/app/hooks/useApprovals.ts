import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  fetchApprovals,
  fetchApprovalDetail,
  approveCase,
  type ApprovePayload,
} from "../services/approvalsApi";
import type { AnyCase } from "../types/Records";

interface ApprovalRow {
  uiId: string;
  id: string;
  submittedBy: string;
  submittedTo: string;
  query: string;
  classification: "Deviation" | "Change Control";
  savedOn: string;
  approvalStatus: "pending" | "approved";
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
    approvalStatus:
      (row.approval_status as "pending" | "approved") || "pending",
    raw: row,
  };
}

export function useApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // The identity the user is "logged in as" — same rule the save flow uses to
  // set saved_by, so it lines up with submitted_to written by other users.
  const identity = (user?.displayName || user?.username || "").trim();

  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved"
  >("all");
  const [searchText, setSearchText] = useState("");
  const [submittedByFilter, setSubmittedByFilter] = useState("all");
  const [submittedToFilter, setSubmittedToFilter] = useState("all");

  // Selected case + its full detail (fetched on demand for the edit modal).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AnyCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApprovals(statusFilter);
      setRows(result.data.map(toApprovalRow));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load approvals.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Distinct names for the dropdowns, taken from the full (unfiltered) set.
  const submittedByOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.submittedBy).filter(Boolean)),
      ).sort(),
    [rows],
  );
  const submittedToOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.submittedTo).filter(Boolean)),
      ).sort(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      // Approved cases drop off the Approvals page entirely.
      if (r.approvalStatus === "approved") return false;
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
  }, [rows, searchText, submittedToFilter]);

  // True when the current user is the approver this case was submitted to,
  // or when they're an Admin (Admins can approve any pending case).
  const canApprove = useCallback(
    (row: ApprovalRow) =>
      user?.role === "Admin" ||
      (!!identity && row.submittedTo.toLowerCase() === identity.toLowerCase()),
    [identity, user],
  );

  const openCase = useCallback((row: ApprovalRow) => {
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
  }, []);

  const closeCase = useCallback(() => {
    setSelectedId(null);
    setSelectedDetail(null);
    setDetailError(null);
  }, []);

  // Persist the approver's edits + flip to approved, then go to Records
  // (where the case now shows an "Approved" status). Errors are surfaced
  // instead of failing silently.
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
        navigate("/records");
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
    [identity, user, closeCase, navigate],
  );

  return {
    identity,
    rows: filteredRows,
    allRows: rows,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchText,
    setSearchText,
    submittedByFilter,
    setSubmittedByFilter,
    submittedToFilter,
    setSubmittedToFilter,
    submittedByOptions,
    submittedToOptions,
    selectedId,
    selectedDetail,
    detailLoading,
    detailError,
    isApproving,
    approveError,
    canApprove,
    openCase,
    closeCase,
    submitApproval,
    refetch: load,
  };
}
