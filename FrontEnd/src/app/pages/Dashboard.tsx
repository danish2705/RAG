import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { DateRange } from "react-day-picker";
import { AIAssistantPanel } from "../components/chat/AiAssistant";
import { KpiCardGrid } from "../components/dashboard/KpiCard";
import { RecentRecordsList } from "../components/dashboard/RecentRecordsList";
import { Loader } from "../components/dashboard/Loader";
import {
  DateRangePicker,
  toDateKey,
} from "../components/dashboard/DaterangePicker";
import {
  ChartCard,
  DonutChart,
  EventsOverTimeChart,
  EventsBySiteChart,
  CHART_ROW_HEIGHT,
} from "../components/dashboard/Charts";
import { useDashboard } from "../hooks/useDashboard";
import {
  eventTypeCardMeta,
  metricCardMeta,
  severityColors,
  statusColors,
} from "../utils/dashboardConfig";

export function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const navigate = useNavigate();

  // Convert the calendar's Date-based selection into the "YYYY-MM-DD"
  // strings the API expects. A range with only a "from" isn't sent until
  // "to" is also picked, so the summary doesn't refetch mid-selection.
  const apiDateRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return undefined;
    return {
      startDate: toDateKey(dateRange.from),
      endDate: toDateKey(dateRange.to),
    };
  }, [dateRange]);

  const { summary, loading, error } = useDashboard(apiDateRange);

  const eventTypeCards = eventTypeCardMeta.map((meta) => ({
    label: meta.label,
    sub: meta.sub,
    icon: meta.icon,
    value: summary ? String(summary.eventTypeCards[meta.key]) : "\u2013",
  }));

  const metricCards = metricCardMeta.map((meta) => ({
    label: meta.label,
    sub: meta.sub,
    icon: meta.icon,
    value: summary ? meta.format(summary.metricCards[meta.key]) : "\u2013",
  }));

  // The dashboard only ever surfaces the 3 most recent records; anything
  // beyond that lives on the full Records page.
  const recentRecords = summary?.recentRecords.slice(0, 3) ?? [];

  // The chart's title reflects how the data is actually bucketed: monthly
  // by default (or for a multi-month range), daily when the selected range
  // falls entirely within one calendar month.
  const eventsOverTimeTitle =
    summary?.charts.eventsOverTimeGranularity === "day"
      ? "Events Over Time (Daily)"
      : "Events Over Time (Monthly)";

  // Only show the full-page loader on the very first load. If a background
  // refetch happens later while data's already on screen, don't yank the
  // existing content away — just let it update quietly in place.
  const isInitialLoad = loading && !summary;

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 space-y-6 overflow-y-auto transition-[margin] duration-200 ${
          aiOpen ? "mr-80" : ""
        }`}
      >
        <div className="flex justify-between items-center gap-3">
          <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
          <button
            onClick={() => navigate("/deviation")}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            + New Case
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            Couldn't load dashboard data: {error}
          </div>
        )}

        {isInitialLoad ? (
          <Loader message="Loading dashboard..." minHeight="h-[60vh]" />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <KpiCardGrid title="Events by Type" cards={eventTypeCards} />
              </div>
              <div className="flex-1">
                <KpiCardGrid title="Performance Metrics" cards={metricCards} />
              </div>
            </div>

            {summary && (
              <>
                {/* Row: Events by Type / Events Over Time / Events by Site */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ChartCard title="Events by Type">
                    <DonutChart
                      data={summary.charts.eventsByType}
                      centerLabel="Total"
                      minContentHeight={CHART_ROW_HEIGHT}
                    />
                  </ChartCard>
                  <ChartCard title={eventsOverTimeTitle}>
                    <EventsOverTimeChart data={summary.charts.eventsOverTime} />
                  </ChartCard>
                  <ChartCard title="Events by Site">
                    <EventsBySiteChart data={summary.charts.eventsBySite} />
                  </ChartCard>
                </div>

                {/* Row: Severity Distribution + Events by Status (stacked) / Recent Records */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="flex flex-col gap-6">
                    <ChartCard title="Severity Distribution">
                      <DonutChart
                        data={summary.charts.severityDistribution}
                        centerLabel="Total"
                      />
                    </ChartCard>
                    <ChartCard title="Events by Status">
                      <DonutChart
                        data={summary.charts.eventsByStatus}
                        centerLabel="Total"
                      />
                    </ChartCard>
                  </div>

                  <div className="lg:col-span-2">
                    <RecentRecordsList
                      records={recentRecords}
                      severityColors={severityColors}
                      statusColors={statusColors}
                    />
                    {!loading && recentRecords.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                        No records yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistantPanel isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />
      </div>
    </div>
  );
}