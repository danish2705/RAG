import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";
import type { AnyCase } from "../../types/Records";

export type RecordsSortField = "saved_by" | "classification" | "created_at";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CombinedCaseRow {
  id: number | string;
  query: string;
  saved_by: string;
  classification: AnyCase["classification"];
  status: string;
  created_at: string;
  case_type: "Deviation" | "Change Control";
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function useRecords() {
  const [cases, setCases] = useState<CombinedCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<AnyCase | null>(null);
  const [selectedCaseLoading, setSelectedCaseLoading] = useState(false);
  const [selectedCaseError, setSelectedCaseError] = useState<string | null>(
    null,
  );

  const [chatOpen, setChatOpen] = useState(false);

  const [sortField, setSortField] = useState<RecordsSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [submittedByFilter, setSubmittedByFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(submittedByFilter);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [submittedByFilter]);

  // Reset to page 1 whenever the classification filter or sort changes.
  useEffect(() => {
    setPage(1);
  }, [classificationFilter, sortField, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sortField,
        sortDir: sortDirection,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (classificationFilter !== "all") {
        params.set("classification", classificationFilter);
      }

      try {
        // Single UNION ALL query server-side — exactly PAGE_SIZE rows come
        // back, correctly ordered across both case types, with an accurate
        // total/totalPages count.
        const res = await apiFetch<PaginatedResponse<CombinedCaseRow>>(
          `/api/records?${params.toString()}`,
          { signal: controller.signal },
        );

        setCases(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [page, sortField, sortDirection, debouncedSearch, classificationFilter]);

  const handleSort = (field: RecordsSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // The combined list only carries summary columns (id, query, saved_by,
  // classification, status, created_at, case_type) — rca/capa/
  // risk_criticality/etc aren't in it. So "View" fetches the full record
  // for that one row on demand, using id + case_type to pick the right table.
  const handleSelectCase = async (row: CombinedCaseRow) => {
    setSelectedCaseLoading(true);
    setSelectedCaseError(null);
    try {
      const detail = await apiFetch<AnyCase>(
        `/api/records/${row.id}?case_type=${encodeURIComponent(row.case_type)}`,
      );
      setSelectedCase(detail);
    } catch (err) {
      setSelectedCaseError(
        err instanceof Error ? err.message : "Failed to load case details.",
      );
    } finally {
      setSelectedCaseLoading(false);
    }
  };

  // No client-side filtering/sorting anymore — the API already returned
  // exactly the rows to show for the current page/search/sort.
  const filteredCases = useMemo(() => cases, [cases]);

  return {
    cases,
    loading,
    error,
    selectedCase,
    setSelectedCase,
    selectedCaseLoading,
    selectedCaseError,
    handleSelectCase,
    chatOpen,
    setChatOpen,
    sortField,
    sortDirection,
    handleSort,
    submittedByFilter,
    setSubmittedByFilter,
    classificationFilter,
    setClassificationFilter,
    filteredCases,
    page,
    setPage,
    total,
    totalPages,
  };
}
