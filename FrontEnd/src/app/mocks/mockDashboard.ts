import { LayoutGrid, AlertTriangle, GitBranch, Layers, RefreshCw, BarChart2, CheckCircle, } from "lucide-react";
import type { RecentRecord, SeverityColors, StatusColors, } from "../types/dashboard";

export const recentRecords: RecentRecord[] = [
  {
    id: "DEV-2026-0042",
    severity: "High",
    title: "Temperature excursion in Cold Storage Unit 3",
    status: "Under Investigation",
  },
  {
    id: "DEV-2026-0041",
    severity: "Medium",
    title: "Missing signature on batch record BX-4401",
    status: "CAPA In Progress",
  },
  {
    id: "CC-2026-0015",
    severity: "Low",
    title: "HVAC system upgrade \u2013 Building A",
    status: "Root Cause Analysis",
  },
  {
    id: "DEV-2026-0040",
    severity: "High",
    title: "Out-of-spec result for pH testing \u2013 Lot 2209",
    status: "Root Cause Analysis",
  },
];

export const severityColors: SeverityColors = {
  High: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
};

export const statusColors: StatusColors = {
  "Under Investigation":
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  "CAPA In Progress":
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  "Root Cause Analysis":
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
};

export const eventTypeCards = [
  {
    label: "Total Events",
    value: "163",
    sub: "All quality events, year-to-date",
    icon: LayoutGrid,
  },
  {
    label: "Total Deviation",
    value: "127",
    sub: "Deviation records year-to-date",
    icon: AlertTriangle,
  },
  {
    label: "Total Change Control",
    value: "28",
    sub: "Change control records year-to-date",
    icon: GitBranch,
  },
  {
    label: "Total Hybrid",
    value: "8",
    sub: "Records spanning deviation and change",
    icon: Layers,
  },
];

export const metricCards = [
  {
    label: "Open Cases",
    value: "18",
    sub: "Requiring action or review",
    icon: RefreshCw,
  },
  {
    label: "Recurrence Rate",
    value: "12.3%",
    sub: "Repeat deviations in past 90 days",
    icon: BarChart2,
  },
  {
    label: "CAPA Effectiveness",
    value: "87%",
    sub: "Closed with verified effectiveness",
    icon: CheckCircle,
  },
];
