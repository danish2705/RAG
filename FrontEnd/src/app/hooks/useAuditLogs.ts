import { useEffect, useState, useCallback } from "react";
import { fetchAuditLog } from "../services/auditApi";
import type {
  AuditLogEntry,
  AuditSource,
} from "../types/audit";

export function useAuditLogs() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AuditSource | "all">("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuditLog({
        page,
        pageSize: 25,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        source: sourceFilter,
        search: search || undefined,
      });
      setEntries(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit log.",
      );
      setEntries([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, sourceFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    entries,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sourceFilter,
    setSourceFilter,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    refetch: load,
  };
}
