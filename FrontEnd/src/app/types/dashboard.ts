export interface RecentRecord {
  id: string;
  severity: string;
  title: string;
  status: string;
}

export type SeverityColors = Record<string, string>;
export type StatusColors = Record<string, string>;

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export interface EventsOverTimeDatum {
  month: string;
  allEvents: number;
  deviation: number;
  changeControl: number;
}

export interface EventsBySiteDatum {
  site: string;
  count: number;
}

export interface DashboardCharts {
  eventsByType: DonutDatum[]; // Deviation, Change Control (no "Other")
  eventsOverTime: EventsOverTimeDatum[];
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