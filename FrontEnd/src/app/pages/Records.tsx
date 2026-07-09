import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { AIAssistant } from "../components/chat/ai-assistant";
import { useRecords } from "../hooks/records/useRecords";
import { CaseViewModal } from "../components/records/CaseViewModal";
import { RecordsFilterBar } from "../components/records/RecordsFilterBar";
import { RecordsTable } from "../components/records/RecordsTable";

export function Records() {
  const navigate = useNavigate();
  const {
    cases,
    loading,
    error,
    selectedCase,
    setSelectedCase,
    chatOpen,
    setChatOpen,
    handleSort,
    submittedByFilter,
    setSubmittedByFilter,
    classificationFilter,
    setClassificationFilter,
    filteredCases,
  } = useRecords();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        {selectedCase && (
          <CaseViewModal record={selectedCase} onClose={() => setSelectedCase(null)} />
        )}

        <div className="mb-6 flex items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredCases.length} case{filteredCases.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate("/deviation")}
          >
            + New Case
          </Button>
        </div>

        <RecordsFilterBar
          submittedByFilter={submittedByFilter}
          onSubmittedByFilterChange={setSubmittedByFilter}
          classificationFilter={classificationFilter}
          onClassificationFilterChange={setClassificationFilter}
          resultCount={filteredCases.length}
        />

        <RecordsTable
          loading={loading}
          error={error}
          cases={cases}
          filteredCases={filteredCases}
          onSort={handleSort}
          onSelectCase={setSelectedCase}
        />
      </div>
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
  );
}