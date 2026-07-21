import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import type {
  DonutDatum,
  EventsOverTimeDatum,
  EventsBySiteDatum,
} from "../../types/dashboard";
import { eventsOverTimeColors, eventsBySiteColor } from "../../utils/dashboardConfig";

// ---------------------------------------------------------------------------
// Dark mode detection
// ---------------------------------------------------------------------------
// Recharts renders raw SVG, so it can't pick up Tailwind's `dark:` classes
// on its own — grid lines, axis ticks, and tooltips need actual color
// values computed in JS. This watches the `dark` class on <html> (the
// standard Tailwind "class" strategy) and re-renders charts when it flips.
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function useChartTheme() {
  const isDark = useIsDarkMode();
  return {
    isDark,
    gridStroke: isDark ? "#1f2937" : "#e5e7eb",
    axisTick: isDark ? "#9ca3af" : "#6b7280",
    tooltip: {
      contentStyle: {
        backgroundColor: isDark ? "#111827" : "#ffffff",
        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
        borderRadius: 8,
        fontSize: 12,
        boxShadow: isDark
          ? "0 4px 12px rgba(0,0,0,0.5)"
          : "0 4px 12px rgba(0,0,0,0.08)",
      },
      // contentStyle alone only themes the tooltip's outer box — the
      // label/value text inside has its own defaults (black) unless
      // itemStyle/labelStyle are set explicitly too.
      itemStyle: {
        color: isDark ? "#f3f4f6" : "#111827",
      },
      labelStyle: {
        color: isDark ? "#f3f4f6" : "#111827",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------
export function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 cursor-pointer transition-transform duration-200 ease-out hover:scale-105 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

// Skeleton version of ChartCard shown while dashboard data is still loading.
// Mirrors the same container styling so the layout doesn't jump once real
// charts swap in.
export function ChartCardSkeleton({
  title,
  variant = "donut",
}: {
  title: string;
  variant?: "donut" | "line" | "bar";
}) {
  return (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <MoreHorizontal className="h-4 w-4 text-gray-300 dark:text-gray-700" />
      </div>

      {variant === "donut" && (
        <div className="flex items-center gap-6 animate-pulse">
          <div className="h-40 w-40 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-3 flex-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="h-3 flex-1 max-w-[120px] rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "line" && (
        <div className="animate-pulse">
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div className="h-[200px] rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      )}

      {variant === "bar" && (
        <div className="h-[230px] flex items-end gap-4 px-2 animate-pulse">
          {[70, 45, 90, 55].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gray-100 dark:bg-gray-800"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut chart (Events by Type, Severity Distribution, Events by Status)
// ---------------------------------------------------------------------------
export function DonutChart({
  data,
  centerLabel,
}: {
  data: DonutDatum[];
  centerLabel: string;
}) {
  const { tooltip } = useChartTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip {...tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {total}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{d.label}</span>
            <span className="text-gray-400 dark:text-gray-500">
              {d.value} ({total ? Math.round((d.value / total) * 1000) / 10 : 0}
              %)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events Over Time (line chart)
// ---------------------------------------------------------------------------
export function EventsOverTimeChart({ data }: { data: EventsOverTimeDatum[] }) {
  const { gridStroke, axisTick, tooltip } = useChartTheme();

  return (
    <div>
      <div className="flex justify-center gap-4 mb-2 text-xs">
        <LegendDot color={eventsOverTimeColors.allEvents} label="All Events" />
        <LegendDot color={eventsOverTimeColors.deviation} label="Deviation" />
        <LegendDot
          color={eventsOverTimeColors.changeControl}
          label="Change Control"
        />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: axisTick }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: axisTick }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip {...tooltip} />
          <Line
            type="monotone"
            dataKey="allEvents"
            name="All Events"
            stroke={eventsOverTimeColors.allEvents}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="deviation"
            name="Deviation"
            stroke={eventsOverTimeColors.deviation}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="changeControl"
            name="Change Control"
            stroke={eventsOverTimeColors.changeControl}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events by Site (bar chart)
// ---------------------------------------------------------------------------
export function EventsBySiteChart({ data }: { data: EventsBySiteDatum[] }) {
  const { gridStroke, axisTick, tooltip } = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis
          dataKey="site"
          tick={{ fontSize: 11, fill: axisTick }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 12, fill: axisTick }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip {...tooltip} cursor={{ fill: gridStroke, opacity: 0.4 }} />
        <Bar
          dataKey="count"
          fill={eventsBySiteColor}
          radius={[4, 4, 0, 0]}
          label={{ position: "top", fontSize: 12, fill: axisTick }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}