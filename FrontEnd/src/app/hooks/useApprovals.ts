import { useState, useMemo, useEffect, useCallback } from "react";
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

  // Selected case + its full detail (fetched on demand for the edit modal).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AnyCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);

  const load = useCallback(async () => {
    if (!identity) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApprovals(identity, statusFilter);
      setRows(result.data.map(toApprovalRow));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load approvals.",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [identity, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const q = searchText.toLowerCase();
    return rows.filter(
      (r) =>
        r.submittedBy.toLowerCase().includes(q) ||
        r.query.toLowerCase().includes(q),
    );
  }, [rows, searchText]);

  // True when the current user is the approver this case was submitted to.
  const canApprove = useCallback(
    (row: ApprovalRow) =>
      !!identity && row.submittedTo.toLowerCase() === identity.toLowerCase(),
    [identity],
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

  // Persist the approver's edits + flip to approved, then refresh the queue.
  const submitApproval = useCallback(
    async (
      id: string,
      caseType: "Deviation" | "Change Control",
      updates: Record<string, unknown>,
    ) => {
      setIsApproving(true);
      try {
        const payload: ApprovePayload = {
          approved_by: identity || "Unknown",
          updates,
        };
        await approveCase(id, caseType, payload);
        closeCase();
        await load();
      } finally {
        setIsApproving(false);
      }
    },
    [identity, closeCase, load],
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
    selectedId,
    selectedDetail,
    detailLoading,
    detailError,
    isApproving,
    canApprove,
    openCase,
    closeCase,
    submitApproval,
    refetch: load,
  };
}
