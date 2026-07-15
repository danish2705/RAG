import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";
import type { DashboardSummary } from "../../types/dashboard";

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<DashboardSummary>(
          "/api/dashboard/summary",
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
  }, []);

  return { summary, loading, error };
}