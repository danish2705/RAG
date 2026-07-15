import type { Request, Response } from "express";
import {
  getDashboardCounts,
  getRecurrenceRate,
  getCapaEffectiveness,
  getRecentRecords,
} from "../repository/dashboardRepository.js";

// GET DASHBOARD SUMMARY: KPI cards + recent records for the Dashboard page,
// computed from real deviation_cases / change_control_cases rows.
export async function getDashboardSummary(
  _req: Request,
  res: Response,
): Promise<void> {
  const [counts, recurrenceRate, capaEffectiveness, recentRecords] =
    await Promise.all([
      getDashboardCounts(),
      getRecurrenceRate(),
      getCapaEffectiveness(),
      getRecentRecords(5),
    ]);

  const totalEvents = counts.totalDeviations + counts.totalChangeControls;
  const openCases = counts.openDeviations + counts.openChangeControls;

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
  });
}