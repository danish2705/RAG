export interface RecentRecord {
  id: string;
  severity: string;
  title: string;
  status: string;
}

export type SeverityColors = Record<string, string>;

export type StatusColors = Record<string, string>;

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
}