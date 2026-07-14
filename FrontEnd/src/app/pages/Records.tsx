import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { AIAssistant } from "../components/chat/AiAssistant";
import { useRecords } from "../hooks/records/useRecords";
import { CaseViewModal } from "../components/records/CaseViewModal";
import { RecordsFilterBar } from "../components/records/RecordsFilterBar";
import { RecordsTable } from "../components/records/RecordsTable";
import { RecordsPagination } from "../components/records/RecordsPagination";

export function Records() {
  const navigate = useNavigate();
  const {
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
  } = useRecords();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        {selectedCase && (
          <CaseViewModal
            record={selectedCase}
            onClose={() => setSelectedCase(null)}
          />
        )}

        {/* Small overlay while the full case detail is being fetched for
            the View modal (the list only has summary columns). */}
        {selectedCaseLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-3 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-foreground">Loading case…</span>
            </div>
          </div>
        )}

        {selectedCaseError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-background rounded-lg px-4 py-3 shadow-lg max-w-sm text-center">
              <p className="text-sm text-red-500 font-medium">
                Couldn't load case details
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCaseError}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} case{total === 1 ? "" : "s"}
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
          resultCount={total}
        />

        <RecordsTable
          loading={loading}
          error={error}
          cases={cases}
          filteredCases={filteredCases}
          onSort={handleSort}
          onSelectCase={handleSelectCase}
        />

        <RecordsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
