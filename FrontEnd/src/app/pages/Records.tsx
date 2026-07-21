import { useNavigate } from "react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { AIAssistant } from "../components/chat/AiAssistant";
import { useRecords } from "../hooks/useRecords";
import { DeviationViewModal } from "../components/records/DeviationViewModal";
import { ChangeControlViewModal } from "../components/records/ChangeControlViewModal";
import { DeleteRecordModal } from "../components/records/DeleteRecordModal";
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
    selectedCaseDetail,
    detailLoading,
    detailError,
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
  } = useRecords();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${
          chatOpen ? "mr-80" : ""
        }`}
      >
        {/* Case Details View Modal — full pipeline detail, fetched on demand */}
        {selectedCase && (detailLoading || detailError) && (
          <Dialog open onOpenChange={() => setSelectedCase(null)}>
            <DialogContent className="max-w-md">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Loading case details...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-semibold">
                    Failed to load case details
                  </p>
                  <p className="text-xs text-muted-foreground">{detailError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedCase(selectedCase)}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {selectedCaseDetail?.case_type === "Deviation" && (
          <DeviationViewModal
            record={selectedCaseDetail}
            onClose={() => setSelectedCase(null)}
          />
        )}

        {selectedCaseDetail?.case_type === "Change Control" && (
          <ChangeControlViewModal
            record={selectedCaseDetail}
            onClose={() => setSelectedCase(null)}
          />
        )}

        {/* Two-Step Delete Confirmation Modal */}
        <DeleteRecordModal
          open={!!caseToDelete}
          onOpenChange={(open) => !open && setCaseToDelete(null)}
          record={caseToDelete}
          onConfirmDelete={handleDeleteRecord}
        />

        <div className="mb-6 flex items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">
              {filteredCases.length} case{filteredCases.length === 1 ? "" : "s"}{" "}
              found
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
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
          onDeleteCase={setCaseToDelete}
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
