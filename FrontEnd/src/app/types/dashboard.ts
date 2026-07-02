export interface RecentRecord {
  id: string;
  severity: string;
  title: string;
  status: string;
}

export type SeverityColors = Record<string, string>;

export type StatusColors = Record<string, string>;
