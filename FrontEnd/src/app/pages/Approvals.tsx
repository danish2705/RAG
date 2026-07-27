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
import { useApprovals } from "../hooks/useApprovals";
import { ApprovalsTable } from "../components/approvals/ApprovalsTable";
import { ApprovalEditModal } from "../components/approvals/ApprovalEditModal";

export function Approvals() {
  const {
    identity,
    rows,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchText,
    setSearchText,
    selectedId,
    selectedDetail,
    detailLoading,
    detailError,
    isApproving,
    canApprove,
    openCase,
    closeCase,
    submitApproval,
  } = useApprovals();

  const selectedRow = rows.find((r) => r.id === selectedId);
  // Already-approved cases open read-only; pending cases open editable, but
  // only when the logged-in user is genuinely the assigned approver.
  const readOnly = selectedRow
    ? selectedRow.approvalStatus === "approved" || !canApprove(selectedRow)
    : false;

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
            onClose={closeCase}
            onApprove={submitApproval}
          />
        )}

        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            {identity
              ? `Cases submitted to you (${identity}) for approval`
              : "Cases submitted to you for approval"}
          </p>
        </div>

        {/* Filter bar — search + status */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submitted by, query…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "pending" | "approved")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
