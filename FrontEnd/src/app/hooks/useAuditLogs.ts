import { useEffect, useState, useCallback } from "react";
import { fetchAuditLog } from "../services/auditApi";
import type {
  AuditLogEntry,
  AuditSource,
} from "../types/audit";
import { auditTrailData } from "../mocks/mockAudit";

export function useAuditLogs() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

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
      setUsingFallback(false);
    } catch (err) {
      // Backend audit endpoint not reachable yet — fall back to mock data
      // so the page still renders something during local UI development.
      setError(
        err instanceof Error ? err.message : "Failed to load audit log.",
      );
      setUsingFallback(true);
      setEntries(
        auditTrailData.map((m, i) => ({
          id: i,
          entity_type: "Deviation",
          entity_id: "",
          action: m.type === "ai" ? "ai_suggestion" : "created",
          source: m.type as AuditSource,
          performed_by: m.user,
          field_name: null,
          old_value: null,
          new_value: null,
          record_snapshot: null,
          reason: m.action,
          created_at: m.timestamp,
        })),
      );
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
    usingFallback,
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
