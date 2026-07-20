import { useState } from "react";
import { AIAssistant } from "../components/chat/AiAssistant";
import { AuditFilters } from "../components/auditLogs/AuditFilters";
import { ActivityLogTable } from "../components/auditLogs/ActivityLogTable";
import { Button } from "../components/ui/button";
import { useAuditLogs } from "../hooks/useAuditLogs";

export function AuditLogs() {
  const [chatOpen, setChatOpen] = useState(false);
  const {
    entries,
    loading,
    error,
    usingFallback,
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
  } = useAuditLogs();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        <div className="space-y-6">
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

          {usingFallback && error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-4 py-2 text-xs text-amber-800 dark:text-amber-400">
              Couldn't reach the audit log API ({error}) — showing sample data
              instead.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading activity log...
            </div>
          ) : (
            <ActivityLogTable entries={entries} />
          )}

          {!usingFallback && totalPages > 1 && (
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
