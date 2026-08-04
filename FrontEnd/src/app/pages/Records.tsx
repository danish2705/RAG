import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertCircle, PenSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { AIAssistant } from "../components/chat/AiAssistant";
import { useRecords } from "../hooks/useRecords";
import { DeviationViewModal } from "../components/records/DeviationViewModal";
import { ChangeControlViewModal } from "../components/records/ChangeControlViewModal";
import { DeleteRecordModal } from "../components/records/DeleteRecordModal";
import { RecordsFilterBar } from "../components/records/RecordsFilterBar";
import { RecordsTable } from "../components/records/RecordsTable";
import { ApprovalEditModal } from "../components/approvals/ApprovalEditModal";

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
    canResubmit,
    resubmitTarget,
    resubmitDetail,
    resubmitDetailLoading,
    resubmitDetailError,
    isResubmitting,
    resubmitError,
    openResubmit,
    closeResubmit,
    submitResubmission,
  } = useRecords();

  // Client-side pagination over the already-filtered/sorted cases from the hook.
  const PAGE_SIZE = 11;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [submittedByFilter, classificationFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginatedCases = filteredCases.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="relative h-full w-full">
      <div
        className={`flex h-full flex-col p-6 transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""
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

        {/* Resubmit flow: reopen a rejected case for edits, then send it
            back to the approver. */}
        {resubmitTarget && (resubmitDetailLoading || resubmitDetailError) && (
          <Dialog open onOpenChange={closeResubmit}>
            <DialogContent className="max-w-md">
              {resubmitDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Loading case details…
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-semibold">
                    Failed to load case details
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resubmitDetailError}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {resubmitDetail && (
          <ApprovalEditModal
            record={resubmitDetail}
            mode="resubmit"
            isApproving={isResubmitting}
            approveError={resubmitError}
            onClose={closeResubmit}
            onResubmit={submitResubmission}
          />
        )}

        {/* Two-Step Delete Confirmation Modal */}
        <DeleteRecordModal
          open={!!caseToDelete}
          onOpenChange={(open) => !open && setCaseToDelete(null)}
          record={caseToDelete}
          onConfirmDelete={handleDeleteRecord}
        />

        <div className="shrink-0">
          <RecordsFilterBar
            submittedByFilter={submittedByFilter}
            onSubmittedByFilterChange={setSubmittedByFilter}
            classificationFilter={classificationFilter}
            onClassificationFilterChange={setClassificationFilter}
            resultCount={filteredCases.length}
          />
        </div>

        <div className="min-h-0 flex-1">
          <RecordsTable
            loading={loading}
            error={error}
            cases={cases}
            filteredCases={paginatedCases}
            onSort={handleSort}
            onSelectCase={setSelectedCase}
            onDeleteCase={setCaseToDelete}
            canResubmit={canResubmit}
            onResubmit={openResubmit}
          />
        </div>

        {!loading && !error && totalPages > 1 && (
          <div className="mt-4 flex shrink-0 items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
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