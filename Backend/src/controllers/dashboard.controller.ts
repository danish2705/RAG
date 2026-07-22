import type { Request, Response } from "express";
import {
  getDashboardCounts,
  getRecurrenceRate,
  getCapaEffectiveness,
  getRecentRecords,
  buildEventsByTypeChart,
  getEventsOverTime,
  getEventsBySite,
  getSeverityDistribution,
  getEventsByStatusDistribution,
  type DashboardDateRange,
} from "../repository/dashboardRepository.js";

// Colors kept in sync with the client's dashboardConfig.ts palettes.
const EVENT_TYPE_COLORS: Record<string, string> = {
  Deviation: "#3B82F6",
  "Change Control": "#8B5CF6",
};

const SEVERITY_COLORS: Record<string, string> = {
  High: "#EF4444",
  Medium: "#F59E0B",
  Low: "#22C55E",
};

// Only two statuses exist in the pipeline (halted_for_human_review /
// completed_pending_human_review), surfaced to the client as
// Pending / Completed.
const STATUS_COLORS: Record<string, string> = {
  Pending: "#3B82F6",
  Completed: "#F59E0B",
};
const DEFAULT_STATUS_COLOR = "#9CA3AF"; // gray, for unmapped/raw statuses

// Reads the optional ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD calendar
// filter selected on the Dashboard page. Both are inclusive; omitted
// entirely falls back to each query's own default window.
function parseDateRange(req: Request): DashboardDateRange {
  const q = req.query;
  return {
    startDate: typeof q.startDate === "string" ? q.startDate : undefined,
    endDate: typeof q.endDate === "string" ? q.endDate : undefined,
  };
}

// GET DASHBOARD SUMMARY: KPI cards + charts + recent records for the
// Dashboard page, computed from real deviation_cases / change_control_cases
// rows.
export async function getDashboardSummary(
  req: Request,
  res: Response,
): Promise<void> {
  const range = parseDateRange(req);

  const [
    counts,
    recurrenceRate,
    capaEffectiveness,
    recentRecords,
    eventsOverTime,
    eventsBySite,
    severityDistribution,
    eventsByStatusRaw,
  ] = await Promise.all([
    getDashboardCounts(range),
    getRecurrenceRate(range),
    getCapaEffectiveness(range),
    getRecentRecords(3, range),
    getEventsOverTime(range),
    getEventsBySite(range),
    getSeverityDistribution(range),
    getEventsByStatusDistribution(range),
  ]);

  const totalEvents = counts.totalDeviations + counts.totalChangeControls;
  const openCases = counts.openDeviations + counts.openChangeControls;

  const eventsByType = buildEventsByTypeChart(counts).map((d) => ({
    ...d,
    color: EVENT_TYPE_COLORS[d.label] ?? "#9CA3AF",
  }));

  const severityChart = (
    Object.entries(severityDistribution) as [string, number][]
  ).map(([label, value]) => ({
    label,
    value,
    color: SEVERITY_COLORS[label] ?? "#9CA3AF",
  }));

  const statusChart = Object.entries(eventsByStatusRaw).map(
    ([label, value]) => ({
      label,
      value,
      color: STATUS_COLORS[label] ?? DEFAULT_STATUS_COLOR,
    }),
  );

  res.json({
    eventTypeCards: {
      totalEvents,
      totalDeviations: counts.totalDeviations,
      totalChangeControls: counts.totalChangeControls,
    },
    metricCards: {
      openCases,
      recurrenceRate,
      capaEffectiveness,
    },
    recentRecords,
    charts: {
      eventsByType,
      eventsOverTime: eventsOverTime.rows,
      eventsOverTimeGranularity: eventsOverTime.granularity,
      eventsBySite: eventsBySite.map((r) => ({ site: r.site, count: r.count })),
      severityDistribution: severityChart,
      eventsByStatus: statusChart,
    },
  });
}