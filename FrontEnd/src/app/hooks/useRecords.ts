import { useState, useMemo } from "react";
import { apiFetch } from "../utils/api";

// Fallback mock data in case API fails or during UI testing
const INITIAL_MOCK_CASES = [
  {
    uiId: "#1105abb9",
    id: "1105abb9-cf3a-46f0-94c0-c3d7399dca57",
    submittedBy: "Sameera",
    query:
      "Site: Manufacturing Plant B Date/Time Detected: 2026-07-13T19:04 Source System: Eq",
    classification: "Change Control",
    savedOn: "14 Jul 2026, 10:15 AM IST",
    rationale: [
      "Equipment calibration drifted outside acceptable tolerance.",
      "Requires change control filing.",
    ],
  },
  {
    uiId: "#1a80f916",
    id: "1a80f916-ca8a-4111-bc02-8c14efe03b33",
    submittedBy: "sampath",
    query:
      "Site: Manufacturing Plant B Date/Time Detected: 2026-07-09T20:27 Source System: Eq",
    classification: "Deviation",
    savedOn: "10 Jul 2026, 04:30 PM IST",
    rationale: [
      "Unexpected temperature spike in storage vault C.",
      "Immediate containment executed.",
    ],
  },
  {
    uiId: "#1df60a25",
    id: "1df60a25-f424-4fdc-acab-38ea84bfda66",
    submittedBy: "Danish",
    query:
      "Site: Manufacturing Plant B Date/Time Detected: 2026-07-09T07:04 Source System: Eq",
    classification: "Change Control",
    savedOn: "09 Jul 2026, 11:20 AM IST",
    rationale: ["Planned HVAC firmware upgrade across Building 2."],
  },
  {
    uiId: "#d43d3391",
    id: "d43d3391-a921-423f-9c0b-7c4aade50f75",
    submittedBy: "Danish",
    query:
      "Site: Manufacturing Plant A Date/Time Detected: 2026-07-09T06:17 Source System: Eq",
    classification: "Deviation",
    savedOn: "09 Jul 2026, 09:05 AM IST",
    rationale: [
      "Batch record BX-4401 missing operator verification signature.",
    ],
  },
];

export function useRecords() {
  const [cases, setCases] = useState<any[]>(INITIAL_MOCK_CASES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [caseToDelete, setCaseToDelete] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [submittedByFilter, setSubmittedByFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("All Types");
  const [sortField, setSortField] = useState<string>("savedOn");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

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
  const filteredCases = useMemo(() => {
    return cases
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
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [cases, submittedByFilter, classificationFilter, sortField, sortAsc]);

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
    cases,
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
  };
}
