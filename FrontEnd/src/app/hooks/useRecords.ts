import { useState, useMemo, useEffect, useCallback } from "react";
import { apiFetch } from "../utils/api";
import { fetchRecords } from "../services/recordsApi";
import { useAuth } from "../context/AuthContext";
import type { AnyCase } from "../types/Records";

// UI-shaped row the table/modals expect. Mapped from the backend's
// AnyCase (id, query, saved_by, classification jsonb, case_type, ...).
interface RecordRow {
  uiId: string;
  id: string;
  submittedBy: string;
  query: string;
  classification: "Deviation" | "Change Control";
  savedOn: string;
  raw: AnyCase;
}

function toRecordRow(row: AnyCase): RecordRow {
  return {
    uiId: `#${String(row.id).slice(0, 8)}`,
    id: String(row.id),
    submittedBy: row.saved_by || "N/A",
    query: row.query || "",
    classification: row.case_type,
    savedOn: row.created_at,
    raw: row,
  };
}

export function useRecords() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  const [cases, setCases] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [submittedByFilter, setSubmittedByFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("All Types");
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
    if (role !== "user" || !user?.username) return cases;
    return cases.filter(
      (item) => item.submittedBy?.toLowerCase() === user.username.toLowerCase(),
    );
  }, [cases, role, user?.username]);

  const filteredCases = useMemo(() => {
    return ownRecordsOnly
      .filter((item) => {
        const matchesUser =
          !submittedByFilter ||
          item.submittedBy
            ?.toLowerCase()
            .includes(submittedByFilter.toLowerCase()) ||
          item.query?.toLowerCase().includes(submittedByFilter.toLowerCase());

        const matchesType =
          classificationFilter === "All Types" ||
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
  }, [ownRecordsOnly, submittedByFilter, classificationFilter, sortField, sortAsc]);

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

  return {
    cases: ownRecordsOnly,
    loading,
    error,
    selectedCase,
    setSelectedCase,
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
  };
}