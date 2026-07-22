import {
  LayoutGrid,
  AlertTriangle,
  GitBranch,
  RefreshCw,
  BarChart2,
  CheckCircle,
} from "lucide-react";
import type { SeverityColors, StatusColors } from "../types/dashboard";

export const severityColors: SeverityColors = {
  High: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
};

export const statusColors: StatusColors = {
  Pending: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  Completed:
    "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
};

// Colors for the chart series, kept separate from the badge classes above.
// These are for reference / potential client-side reuse; the server already
// attaches a `color` to each DonutDatum in the /api/dashboard/summary
// response, so most chart components just use `d.color` directly.
export const eventTypeChartColors: Record<string, string> = {
  Deviation: "#3B82F6", // blue
  "Change Control": "#8B5CF6", // purple
};

export const severityChartColors: Record<string, string> = {
  High: "#EF4444", // red
  Medium: "#F59E0B", // orange
  Low: "#22C55E", // green
};

export const statusChartColors: Record<string, string> = {
  Pending: "#3B82F6", // blue
  Completed: "#F59E0B", // gold
};

export const eventsOverTimeColors = {
  allEvents: "#3B82F6",
  deviation: "#8B5CF6",
  changeControl: "#22C55E",
};

export const eventsBySiteColor = "#3B82F6";

// Static presentation metadata (label/sub/icon) for each KPI card. The
// numeric `value` is filled in from the live /api/dashboard/summary response.
export const eventTypeCardMeta = [
  {
    key: "totalEvents" as const,
    label: "Total Events",
    sub: "All quality events, year-to-date",
    icon: LayoutGrid,
  },
  {
    key: "totalDeviations" as const,
    label: "Total Deviation",
    sub: "Deviation records year-to-date",
    icon: AlertTriangle,
  },
  {
    key: "totalChangeControls" as const,
    label: "Total Change Control",
    sub: "Change control records year-to-date",
    icon: GitBranch,
  },
];

export const metricCardMeta = [
  {
    key: "openCases" as const,
    label: "Open Cases",
    sub: "Requiring action or review",
    icon: RefreshCw,
    format: (v: number) => String(v),
  },
  {
    key: "recurrenceRate" as const,
    label: "Recurrence Rate",
    sub: "Repeat root causes in past 90 days",
    icon: BarChart2,
    format: (v: number) => `${v.toFixed(1)}%`,
  },
  {
    key: "capaEffectiveness" as const,
    label: "CAPA Effectiveness",
    sub: "Required CAPAs completed without escalation",
    icon: CheckCircle,
    format: (v: number) => `${v.toFixed(0)}%`,
  },
];