import { useState } from "react";
import { useNavigate } from "react-router";
import { AIAssistantPanel } from "../components/chat/AiAssistant";
import { KpiCardGrid } from "../components/dashboard/KpiCard";
import { RecentRecordsList } from "../components/dashboard/RecentRecordsList";
import { Loader } from "../components/dashboard/Loader";
import {
  ChartCard,
  DonutChart,
  EventsOverTimeChart,
  EventsBySiteChart,
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
  const navigate = useNavigate();
  const { summary, loading, error } = useDashboard();

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
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/deviation")}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            + New Quality Event
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
            <KpiCardGrid title="Events by Type" cards={eventTypeCards} />
            <KpiCardGrid title="Performance Metrics" cards={metricCards} />

            {summary && (
              <>
                {/* Row: Events by Type / Events Over Time / Events by Site */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ChartCard title="Events by Type">
                    <DonutChart
                      data={summary.charts.eventsByType}
                      centerLabel="Total"
                    />
                  </ChartCard>
                  <ChartCard title="Events Over Time (Monthly)">
                    <EventsOverTimeChart data={summary.charts.eventsOverTime} />
                  </ChartCard>
                  <ChartCard title="Events by Site">
                    <EventsBySiteChart data={summary.charts.eventsBySite} />
                  </ChartCard>
                </div>

                {/* Row: Severity Distribution / Events by Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </>
            )}

            <RecentRecordsList
              records={summary?.recentRecords ?? []}
              severityColors={severityColors}
              statusColors={statusColors}
            />
            {!loading && summary && summary.recentRecords.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No records yet.
              </p>
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