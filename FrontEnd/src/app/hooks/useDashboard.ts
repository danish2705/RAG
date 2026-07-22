import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import type { DashboardSummary, DashboardDateRange } from "../types/dashboard";

export function useDashboard(range?: DashboardDateRange) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Destructure so the effect only re-runs when the actual date values
  // change, not when the caller passes a new object reference each render.
  const startDate = range?.startDate;
  const endDate = range?.endDate;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const query = params.toString();

        const result = await apiFetch<DashboardSummary>(
          `/api/dashboard/summary${query ? `?${query}` : ""}`,
        );
        if (!cancelled) setSummary(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return { summary, loading, error };
}