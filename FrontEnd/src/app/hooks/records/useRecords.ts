import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";
import type { AnyCase, DeviationCase, ChangeControlCase } from "../../types/Records";

export type RecordsSortField = "saved_by" | "classification" | "created_at";

export function useRecords() {
  const [cases, setCases] = useState<AnyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<AnyCase | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [sortField, setSortField] = useState<RecordsSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [submittedByFilter, setSubmittedByFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [deviationCases, changeControlCases] = await Promise.all([
          apiFetch<DeviationCase[]>("/api/cases"),
          apiFetch<ChangeControlCase[]>("/api/change-control/cases"),
        ]);

        const merged: AnyCase[] = [
          ...deviationCases.map((c) => ({ ...c, case_type: "Deviation" as const })),
          ...changeControlCases.map((c) => ({
            ...c,
            case_type: "Change Control" as const,
          })),
        ];

        merged.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setCases(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSort = (field: RecordsSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredCases = useMemo(() => {
    let data = [...cases];

    data = data.filter((c) => {
      const matchesSubmittedBy =
        !submittedByFilter ||
        (c.saved_by || "").toLowerCase().includes(submittedByFilter.toLowerCase());

      const matchesClassification =
        classificationFilter === "all" ||
        c.classification?.classification === classificationFilter;

      return matchesSubmittedBy && matchesClassification;
    });

    data.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortField) {
        case "saved_by":
          valueA = a.saved_by || "";
          valueB = b.saved_by || "";
          break;

        case "classification":
          valueA = a.classification?.classification || "";
          valueB = b.classification?.classification || "";
          break;

        case "created_at":
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

    return data;
  }, [cases, submittedByFilter, classificationFilter, sortField, sortDirection]);

  return {
    cases,
    loading,
    error,
    selectedCase,
    setSelectedCase,
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
  };
}