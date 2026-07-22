export interface RecentRecord {
  id: string;
  severity: string;
  title: string;
  status: string;
}

// Inclusive "YYYY-MM-DD" date filter selected via the Dashboard's calendar
// range picker. Both bounds are optional so a partial selection (or none)
// is valid.
export interface DashboardDateRange {
  startDate?: string;
  endDate?: string;
}

export type SeverityColors = Record<string, string>;
export type StatusColors = Record<string, string>;

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export interface EventsOverTimeDatum {
  label: string;
  allEvents: number;
  deviation: number;
  changeControl: number;
}

export type EventsOverTimeGranularity = "month" | "day";

export interface EventsBySiteDatum {
  site: string;
  count: number;
}

export interface DashboardCharts {
  eventsByType: DonutDatum[]; // Deviation, Change Control (no "Other")
  eventsOverTime: EventsOverTimeDatum[];
  eventsOverTimeGranularity: EventsOverTimeGranularity;
  eventsBySite: EventsBySiteDatum[];
  severityDistribution: DonutDatum[];
  eventsByStatus: DonutDatum[];
}

export interface DashboardSummary {
  eventTypeCards: {
    totalEvents: number;
    totalDeviations: number;
    totalChangeControls: number;
  };
  metricCards: {
    openCases: number;
    recurrenceRate: number;
    capaEffectiveness: number;
  };
  recentRecords: RecentRecord[];
  charts: DashboardCharts;
}