import { useState } from "react";
import { AIAssistant } from "../components/chat/AiAssistant";
import { PendingAiReviewsFilters } from "../components/pendingAiReviews/PendingAiReviewsFilter";
import { PendingAiReviewsTable } from "../components/pendingAiReviews/PendingAiReviewTable";
import { Button } from "../components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { usePendingAiReviews } from "../hooks/usePendingAiReviews";

export function PendingAiReviews() {
  const [chatOpen, setChatOpen] = useState(false);
  const {
    entries,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    entityTypeFilter,
    setEntityTypeFilter,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    updatingId,
    toggleStatus,
    resumingId,
    resumeError,
    handleResume,
    refetch,
  } = usePendingAiReviews();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Pending AI Reviews
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Queries saved when the AI service was unavailable, so nothing gets
              lost. Retry them once the service is back up, and mark each one
              Pending or Not Executed as you work through the list.
            </p>
          </div>

          <PendingAiReviewsFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            entityTypeFilter={entityTypeFilter}
            onEntityTypeFilterChange={setEntityTypeFilter}
            search={search}
            onSearchChange={setSearch}
          />

          {resumeError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/10 p-3 text-sm text-amber-800 dark:text-amber-400">
              {resumeError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading pending AI reviews...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-semibold">
                Failed to load pending AI reviews
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                className="mt-1 gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : (
            <PendingAiReviewsTable
              entries={entries}
              updatingId={updatingId}
              onToggleStatus={toggleStatus}
              resumingId={resumingId}
              onResume={handleResume}
            />
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
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
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
