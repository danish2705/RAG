import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { useApprovals } from "../hooks/useApprovals";
import { ApprovalsTable } from "../components/approvals/ApprovalsTable";
import { ApprovalEditModal } from "../components/approvals/ApprovalEditModal";

export function Approvals() {
  const {
    rows,
    loading,
    error,
    searchText,
    setSearchText,
    submittedToFilter,
    setSubmittedToFilter,
    submittedToOptions,
    selectedId,
    selectedDetail,
    detailLoading,
    detailError,
    isApproving,
    approveError,
    isRejecting,
    rejectError,
    canApprove,
    openCase,
    closeCase,
    submitApproval,
    submitRejection,
  } = useApprovals();

  const selectedRow = rows.find((r) => r.id === selectedId);
  const readOnly = selectedRow ? !canApprove(selectedRow) : false;

  // Client-side pagination over the already-filtered rows returned by the hook.
  const PAGE_SIZE = 11;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchText, submittedToFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginatedRows = rows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="relative h-full w-full">
      <div className="flex h-full flex-col p-6">

        {/* Loading / Error Dialog */}
        {selectedId && (detailLoading || detailError) && (
          <Dialog open onOpenChange={closeCase}>
            <DialogContent className="max-w-md">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Loading case details...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-red-600">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-semibold">
                    Failed to load case details
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detailError}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Approval Modal */}
        {selectedDetail && (
          <ApprovalEditModal
            record={selectedDetail}
            readOnly={readOnly}
            isApproving={isApproving}
            approveError={approveError}
            isRejecting={isRejecting}
            rejectError={rejectError}
            onClose={closeCase}
            onApprove={submitApproval}
            onReject={submitRejection}
          />
        )}

        {/* Filter Bar */}
        <div className="mb-5 flex shrink-0 items-center gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              placeholder="Search by user or query..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="
                h-10
                pl-10
                rounded-lg
                border-slate-200
                bg-white
                text-sm
                shadow-sm
                placeholder:text-slate-400
                transition-all
                duration-200
                focus-visible:border-blue-500
                focus-visible:ring-2
                focus-visible:ring-blue-500/10
              "
            />
          </div>

          {/* Approver Filter */}
          <Select
            value={submittedToFilter}
            onValueChange={setSubmittedToFilter}
          >
            <SelectTrigger
              className="
                !h-10
                w-52
                rounded-lg
                border-slate-200
                bg-white
                px-3
                text-sm
                shadow-sm
                transition-all
                duration-200
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/10
              "
            >
              <SelectValue placeholder="Assigned Approver" />
            </SelectTrigger>

            <SelectContent
              className="
                rounded-lg
                border
                border-slate-200
                bg-white
                p-1
                shadow-xl
              "
            >
              <SelectItem
                value="all"
                className="rounded-md text-sm focus:bg-blue-50 focus:text-blue-700"
              >
                All Approvers
              </SelectItem>

              {submittedToOptions.map((name) => (
                <SelectItem
                  key={name}
                  value={name}
                  className="rounded-md text-sm focus:bg-blue-50 focus:text-blue-700"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Result Count */}
          <div
            className="
              flex
              h-10
              min-w-[95px]
              items-center
              justify-center
              rounded-lg
              px-3
              text-sm
              font-semibold
              whitespace-nowrap
            "
          >
            <span className="font-bold text-blue-700">
              {rows.length}
            </span>

            <span className="ml-1 text-slate-700">
              result{rows.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1">
          <ApprovalsTable
            loading={loading}
            error={error}
            rows={paginatedRows}
            canApprove={canApprove}
            onReview={openCase}
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
    </div>
  );
}