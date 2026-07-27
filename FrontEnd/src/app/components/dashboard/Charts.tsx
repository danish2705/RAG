import { useEffect, useState } from "react";
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

// Shared sizing so every chart in the top row (donut / line / bar) renders
// at the same content height and the cards line up regardless of chart
// type or how many legend rows a given dataset happens to produce.
// EVENTS_OVER_TIME_CHART_HEIGHT is a little shorter than CHART_ROW_HEIGHT
// to leave room for its legend row, so the two together still add up to
// the same total as the plain donut/bar cards.
export const CHART_ROW_HEIGHT = 190;
const EVENTS_OVER_TIME_CHART_HEIGHT = 158;

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
      className={`bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-4 cursor-pointer transition-transform duration-200 ease-out hover:scale-105 ${className}`}
    >
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
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
    <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      {variant === "donut" && (
        <div
          className="flex items-center gap-5 animate-pulse"
          style={{ minHeight: CHART_ROW_HEIGHT }}
        >
          <div className="h-24 w-24 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800" />
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
          <div className="flex justify-center gap-4 mb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div
            className="rounded-lg bg-gray-100 dark:bg-gray-800"
            style={{ height: EVENTS_OVER_TIME_CHART_HEIGHT }}
          />
        </div>
      )}

      {variant === "bar" && (
        <div
          className="flex items-end gap-4 px-2 animate-pulse"
          style={{ height: CHART_ROW_HEIGHT }}
        >
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
  minContentHeight,
}: {
  data: DonutDatum[];
  centerLabel: string;
  // Only pass this when the donut sits alongside line/bar charts in the
  // same row and needs to match their height (see "Events by Type" in the
  // top row). Stacked donut-only usage (Severity Distribution / Events by
  // Status) omits it so the card sizes to its own content instead of
  // inheriting a height meant for a different row.
  minContentHeight?: number;
}) {
  const { tooltip } = useChartTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className="flex items-center gap-5"
      style={minContentHeight ? { minHeight: minContentHeight } : undefined}
    >
      <div className="relative h-24 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={30}
              outerRadius={44}
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
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {total}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {d.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-snug">
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
// Beyond this many points, ticks/labels/dots get too cramped in the card's
// natural width — past this we give each point a fixed pixel width and let
// the chart scroll horizontally instead of squeezing everything together.
const DAY_OVERFLOW_THRESHOLD = 8;
const MIN_PX_PER_POINT = 56;

export function EventsOverTimeChart({ data }: { data: EventsOverTimeDatum[] }) {
  const { gridStroke, axisTick, tooltip } = useChartTheme();

  const needsScroll = data.length > DAY_OVERFLOW_THRESHOLD;
  const chartMinWidth = needsScroll ? data.length * MIN_PX_PER_POINT : undefined;

  return (
    <div>
      <div className="flex justify-center gap-4 mb-2">
        <LegendDot color={eventsOverTimeColors.allEvents} label="All Events" />
        <LegendDot color={eventsOverTimeColors.deviation} label="Deviation" />
        <LegendDot
          color={eventsOverTimeColors.changeControl}
          label="Change Control"
        />
      </div>
      <div className={needsScroll ? "overflow-x-auto" : undefined}>
        <div
          style={{
            minWidth: chartMinWidth ?? "100%",
            height: EVENTS_OVER_TIME_CHART_HEIGHT,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 18, right: 24, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: axisTick }}
                axisLine={false}
                tickLine={false}
                // Force every bucket's label to render — recharts otherwise
                // auto-thins ticks (e.g. every other day), which was
                // silently dropping dates from a multi-day range. Now that
                // wide ranges get a fixed min-width + horizontal scroll
                // instead, every label has room and none get dropped or
                // overlapped.
                interval={0}
                // Without padding, the first/last tick sits exactly on the
                // plot's edge and its centered label text overflows outside
                // the chart (the last date was getting clipped/hidden).
                padding={{ left: 12, right: 12 }}
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
                dot={{ r: 4, fill: eventsOverTimeColors.allEvents, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                label={renderPointValueLabel(eventsOverTimeColors.allEvents, -10)}
              />
              <Line
                type="monotone"
                dataKey="deviation"
                name="Deviation"
                stroke={eventsOverTimeColors.deviation}
                strokeWidth={2}
                dot={{ r: 4, fill: eventsOverTimeColors.deviation, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                label={renderPointValueLabel(eventsOverTimeColors.deviation, -22)}
              />
              <Line
                type="monotone"
                dataKey="changeControl"
                name="Change Control"
                stroke={eventsOverTimeColors.changeControl}
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: eventsOverTimeColors.changeControl,
                  strokeWidth: 0,
                }}
                activeDot={{ r: 5 }}
                // Was +16 (below the dot) — every series' value should sit
                // above its dot, so this now uses a negative dy like the
                // other two lines, offset further up to avoid colliding with
                // the All Events / Deviation labels when lines run close.
                label={renderPointValueLabel(eventsOverTimeColors.changeControl, -34)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Renders the numeric value above (negative dy) or below (positive dy) each
// point, in that series' own color — matching the "filled dot + visible
// count" style used elsewhere in the product.
function renderPointValueLabel(color: string, dy: number) {
  return (props: {
    x?: number;
    y?: number;
    value?: number | string;
  }) => {
    const { x, y, value } = props;
    if (x === undefined || y === undefined || value === undefined) return null;
    return (
      <text
        x={x}
        y={y + dy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={color}
      >
        {value}
      </text>
    );
  };
}

// ---------------------------------------------------------------------------
// Events by Site (bar chart)
// ---------------------------------------------------------------------------

// Splits a site name into multiple lines (instead of letting recharts jam
// long labels like "Manufacturing Plant B" / "Manufacturing Plant A" side by
// side, where they visually overlap once several bars share the axis).
// Greedily packs whole words onto a line up to maxCharsPerLine, wrapping to
// a new line rather than truncating or overlapping.
function wrapAxisLabel(text: string, maxCharsPerLine = 14): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

const SITE_TICK_LINE_HEIGHT = 13;

// Custom XAxis tick renderer: recharts clones this element and injects
// x/y/payload, so we read the label off payload.value and lay each wrapped
// line out as its own <tspan>-equivalent <text> element rather than relying
// on recharts' single-line tick which just clips/overlaps long text.
function SiteAxisTick({
  x,
  y,
  payload,
  fill,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  fill?: string;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const lines = wrapAxisLabel(String(payload.value));
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={12 + i * SITE_TICK_LINE_HEIGHT}
          textAnchor="middle"
          fontSize={11}
          fill={fill}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function EventsBySiteChart({ data }: { data: EventsBySiteDatum[] }) {
  const { gridStroke, axisTick, tooltip } = useChartTheme();

  // Reserve extra height for the axis when any site name needs to wrap to
  // a second (or third) line, so wrapped labels have room and don't get
  // cut off or bleed into the chart below.
  const maxLines = Math.max(
    1,
    ...data.map((d) => wrapAxisLabel(d.site).length),
  );
  const axisHeight = 20 + maxLines * SITE_TICK_LINE_HEIGHT;

  return (
    <ResponsiveContainer width="100%" height={CHART_ROW_HEIGHT}>
      <BarChart
        data={data}
        margin={{ top: 18, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis
          dataKey="site"
          tick={<SiteAxisTick fill={axisTick} />}
          height={axisHeight}
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
    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}