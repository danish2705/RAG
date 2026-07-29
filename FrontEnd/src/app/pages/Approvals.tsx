import { Loader2, AlertCircle, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Dialog, DialogContent } from "../components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useApprovals } from "../hooks/useApprovals";
import { ApprovalsTable } from "../components/approvals/ApprovalsTable";
import { ApprovalEditModal } from "../components/approvals/ApprovalEditModal";

export function Approvals() {
  const {
    identity,
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
  // Only the assigned approver can open a case here, and always editable
  // (approved cases no longer appear on this page).
  const readOnly = selectedRow ? !canApprove(selectedRow) : false;

  return (
    <div className="relative h-full w-full">
      <div className="h-full p-6 overflow-y-auto">
        {/* Loading / error state for the on-demand detail fetch */}
        {selectedId && (detailLoading || detailError) && (
          <Dialog open onOpenChange={closeCase}>
            <DialogContent className="max-w-md">
              {detailLoading ? (
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
                  <p className="text-xs text-muted-foreground">{detailError}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Editable review modal */}
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

        {/* Filter bar — search + submitted by + submitted to + status */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submitted by, query…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={submittedToFilter}
                onValueChange={setSubmittedToFilter}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Submitted To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All submitted to</SelectItem>
                  {submittedToOptions.map((name: string) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <ApprovalsTable
          loading={loading}
          error={error}
          rows={rows}
          canApprove={canApprove}
          onReview={openCase}
        />
      </div>
    </div>
  );
}
