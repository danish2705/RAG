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

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "#3B82F6",
  "In Progress": "#22C55E",
  Completed: "#F59E0B",
  Closed: "#EF4444",
};
const DEFAULT_STATUS_COLOR = "#9CA3AF"; // gray, for unmapped/raw statuses

// GET DASHBOARD SUMMARY: KPI cards + charts + recent records for the
// Dashboard page, computed from real deviation_cases / change_control_cases
// rows.
export async function getDashboardSummary(
  _req: Request,
  res: Response,
): Promise<void> {
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
    getDashboardCounts(),
    getRecurrenceRate(),
    getCapaEffectiveness(),
    getRecentRecords(5),
    getEventsOverTime(),
    getEventsBySite(),
    getSeverityDistribution(),
    getEventsByStatusDistribution(),
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
      eventsOverTime,
      eventsBySite: eventsBySite.map((r) => ({ site: r.site, count: r.count })),
      severityDistribution: severityChart,
      eventsByStatus: statusChart,
    },
  });
}
