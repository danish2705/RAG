import { useState } from "react";
import { AIAssistant } from "../components/chat/AiAssistant";
import { AuditFilters } from "../components/auditLogs/AuditFilters";
import { ActivityLogTable } from "../components/auditLogs/ActivityLogTable";
import { Button } from "../components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuditLogs } from "../hooks/useAuditLogs";

export function AuditLogs() {
  const [chatOpen, setChatOpen] = useState(false);
  const {
    entries,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sourceFilter,
    setSourceFilter,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    refetch,
  } = useAuditLogs();

  return (
    <div className="relative h-full w-full">
      <div
        className={`flex h-full flex-col p-6 transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        <div className="mb-6 shrink-0">
          <AuditFilters
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            sourceFilter={sourceFilter}
            onSourceFilterChange={setSourceFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading activity log...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-semibold">Failed to load audit log</p>
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
            <ActivityLogTable entries={entries} />
          )}
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