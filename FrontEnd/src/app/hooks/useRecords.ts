import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { apiFetch } from "../utils/api";
import { fetchRecords, fetchCaseDetail } from "../services/recordsApi";
import { resubmitCase, type ResubmitPayload } from "../services/approvalsApi";
import { useAuth } from "../context/AuthContext";
import type { AnyCase, ApprovalStatus } from "../types/Records";

interface RecordRow {
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
  raw: AnyCase;
}

function toRecordRow(row: AnyCase): RecordRow {
  return {
    uiId: `#${String(row.id).slice(0, 8)}`,
    id: String(row.id),
    submittedBy: row.saved_by || "N/A",
    submittedTo: (row as any).submitted_to || "N/A",
    query: row.query || "",
    classification: row.case_type,
    savedOn: row.created_at,
    approvalStatus:
      ((row as any).approval_status as ApprovalStatus) || "pending",
    rejectionReason: (row as any).rejection_reason ?? null,
    rejectedBy: (row as any).rejected_by ?? null,
    raw: row,
  };
}

export function useRecords() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  // Must match exactly what the save hooks send as `saved_by` — a display
  // name if one was set at login, otherwise the raw username.
  const identity = (user?.displayName || user?.username || "").toLowerCase();

  const [cases, setCases] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCase, setSelectedCaseRaw] = useState<any | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<AnyCase | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Resubmit flow: a rejected case (owned by the current user) gets reopened
  // for edits, then sent back to the approver.
  const [resubmitTarget, setResubmitTargetRaw] = useState<RecordRow | null>(
    null,
  );
  const [resubmitDetail, setResubmitDetail] = useState<AnyCase | null>(null);
  const [resubmitDetailLoading, setResubmitDetailLoading] = useState(false);
  const [resubmitDetailError, setResubmitDetailError] = useState<
    string | null
  >(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState<string | null>(null);

  // Arriving from the "Similar query" prompt's Explore button passes the
  // matching case's text via ?q=... — use it to pre-fill the search filter
  // so the Records table opens already scoped to that query.
  const [searchParams, setSearchParams] = useSearchParams();
  const [submittedByFilter, setSubmittedByFilter] = useState(
    () => searchParams.get("q") || "",
  );
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("savedOn");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecords();
      setCases(result.data.map(toRecordRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records.");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Consume the ?q= param once, then strip it so it doesn't linger in the
  // URL/browser history once the user starts editing the filter themselves.
  useEffect(() => {
    if (searchParams.get("q")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("q");
          return next;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle column header clicks for sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter and sort the cases array cleanly
  // Users can only view and manage their own records; Admins see everything.
  const ownRecordsOnly = useMemo(() => {
    if (role !== "user" || !identity) return cases;
    return cases.filter((item) => item.submittedBy?.toLowerCase() === identity);
  }, [cases, role, identity]);

  const filteredCases = useMemo(() => {
    const filterWords = submittedByFilter
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return ownRecordsOnly
      .filter((item) => {
        // Word-based match (rather than one literal substring) so that
        // navigating in with a full sentence — e.g. from the "similar
        // query" Explore button — still finds the matching record even
        // though the stored query text wraps across multiple lines.
        const combinedText =
          `${item.submittedBy ?? ""} ${item.query ?? ""}`.toLowerCase();
        const matchesUser =
          filterWords.length === 0 ||
          filterWords.every((word) => combinedText.includes(word));

        const matchesType =
          classificationFilter === "all" ||
          item.classification === classificationFilter;

        return matchesUser && matchesType;
      })
      .sort((a, b) => {
        const valA = (a as any)[sortField] || "";
        const valB = (b as any)[sortField] || "";
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    ownRecordsOnly,
    submittedByFilter,
    classificationFilter,
    sortField,
    sortAsc,
  ]);

  // Handle Record Deletion
  const handleDeleteRecord = async (recordId: string, deletedBy: string) => {
    const record = cases.find((c) => c.id === recordId || c.uiId === recordId);
    const caseType =
      record?.classification === "Change Control"
        ? "Change Control"
        : "Deviation";

    await apiFetch(
      `/api/records/${encodeURIComponent(recordId)}?case_type=${encodeURIComponent(caseType)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: deletedBy }),
      },
    );

    setCases((prev) =>
      prev.filter((c) => c.id !== recordId && c.uiId !== recordId),
    );
    setCaseToDelete(null);
  };

  // Opens the View modal immediately (showing a loading state) and fetches
  // the full pipeline detail in the background — /api/records only returns
  // summary columns, so the modal needs the dedicated detail endpoint to
  // show classification/impact/rca/capa/etc.
  const setSelectedCase = useCallback((record: RecordRow | null) => {
    setSelectedCaseRaw(record);
    setSelectedCaseDetail(null);
    setDetailError(null);

    if (!record) return;

    setDetailLoading(true);
    fetchCaseDetail(record.id, record.classification)
      .then((detail) => setSelectedCaseDetail(detail))
      .catch((err) =>
        setDetailError(
          err instanceof Error ? err.message : "Failed to load case detail.",
        ),
      )
      .finally(() => setDetailLoading(false));
  }, []);

  // A case can only be resubmitted by the person who originally submitted
  // it (or an Admin), and only while it's sitting in 'rejected' status.
  const canResubmit = useCallback(
    (row: RecordRow) =>
      row.approvalStatus === "rejected" &&
      (role === "admin" ||
        (!!identity && row.submittedBy.toLowerCase() === identity)),
    [role, identity],
  );

  const openResubmit = useCallback((row: RecordRow) => {
    setResubmitTargetRaw(row);
    setResubmitDetail(null);
    setResubmitDetailError(null);
    setResubmitError(null);
    setResubmitDetailLoading(true);
    fetchCaseDetail(row.id, row.classification)
      .then(setResubmitDetail)
      .catch((err) =>
        setResubmitDetailError(
          err instanceof Error ? err.message : "Failed to load case detail.",
        ),
      )
      .finally(() => setResubmitDetailLoading(false));
  }, []);

  const closeResubmit = useCallback(() => {
    setResubmitTargetRaw(null);
    setResubmitDetail(null);
    setResubmitDetailError(null);
    setResubmitError(null);
  }, []);

  const submitResubmission = useCallback(
    async (
      id: string,
      caseType: "Deviation" | "Change Control",
      updates: Record<string, unknown>,
    ) => {
      setIsResubmitting(true);
      setResubmitError(null);
      try {
        const displayName = user?.displayName || user?.username || "Unknown";
        const payload: ResubmitPayload = {
          resubmitted_by: displayName,
          approver_role: user?.role || "User",
          updates,
        };
        await resubmitCase(id, caseType, payload);
        closeResubmit();
        await loadRecords();
      } catch (err) {
        setResubmitError(
          err instanceof Error
            ? err.message
            : "Could not resubmit the case. Please try again.",
        );
      } finally {
        setIsResubmitting(false);
      }
    },
    [user, closeResubmit, loadRecords],
  );

  return {
    cases: ownRecordsOnly,
    loading,
    error,
    selectedCase,
    setSelectedCase,
    selectedCaseDetail,
    detailLoading,
    detailError,
    caseToDelete,
    setCaseToDelete,
    chatOpen,
    setChatOpen,
    handleSort,
    submittedByFilter,
    setSubmittedByFilter,
    classificationFilter,
    setClassificationFilter,
    filteredCases,
    handleDeleteRecord,
    refetch: loadRecords,
    canResubmit,
    resubmitTarget,
    resubmitDetail,
    resubmitDetailLoading,
    resubmitDetailError,
    isResubmitting,
    resubmitError,
    openResubmit,
    closeResubmit,
    submitResubmission,
  };
}
