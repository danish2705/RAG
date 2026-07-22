import { pool } from "../db.js";

// ---------------------------------------------------------------------------
// Dashboard summary — aggregates real rows from deviation_cases and
// change_control_cases for the Dashboard page (KPI cards, charts, and
// recent records).
// ---------------------------------------------------------------------------

export interface DashboardCounts {
  totalDeviations: number;
  totalChangeControls: number;
  openDeviations: number;
  openChangeControls: number;
}

// Optional inclusive date range (YYYY-MM-DD) used to scope the whole
// dashboard to the dates selected in the calendar filter on the client.
// When omitted, queries fall back to their previous "all time" / rolling
// window behavior.
export interface DashboardDateRange {
  startDate?: string;
  endDate?: string;
}

// Builds a reusable `AND created_at >= ... AND created_at < ...` fragment
// plus the matching bind values. The same fragment/values can be spliced
// into multiple subqueries within one pool.query() call since Postgres
// allows a positional parameter ($1, $2, ...) to be referenced more than
// once.
function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function buildDateFilter(range?: DashboardDateRange): {
  clause: string;
  values: unknown[];
} {
  const values: unknown[] = [];
  let clause = "";
  if (range?.startDate) {
    values.push(range.startDate);
    clause += ` AND created_at >= $${values.length}::date`;
  }
  if (range?.endDate) {
    values.push(range.endDate);
    clause += ` AND created_at < ($${values.length}::date + interval '1 day')`;
  }
  return { clause, values };
}

export interface DashboardRecentRecord {
  id: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  status: string;
  createdAt: string;
  caseType: "Deviation" | "Change Control";
}

// --- Counts + open cases -----------------------------------------------
export async function getDashboardCounts(
  range?: DashboardDateRange,
): Promise<DashboardCounts> {
  const { clause, values } = buildDateFilter(range);
  const result = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) FROM deviation_cases WHERE true${clause}) AS total_deviations,
      (SELECT COUNT(*) FROM change_control_cases WHERE true${clause}) AS total_change_controls,
      (SELECT COUNT(*) FROM deviation_cases
        WHERE status = 'halted_for_human_review'${clause}) AS open_deviations,
      (SELECT COUNT(*) FROM change_control_cases
        WHERE status = 'halted_for_human_review'${clause}) AS open_change_controls
  `,
    values,
  );
  const row = result.rows[0];
  return {
    totalDeviations: Number(row.total_deviations),
    totalChangeControls: Number(row.total_change_controls),
    openDeviations: Number(row.open_deviations),
    openChangeControls: Number(row.open_change_controls),
  };
}

// --- Recurrence rate ------------------------------------------------------
// Proxy metric: among deviations from the last 90 days that reached the RCA
// stage, what share share an (exact-match) primary root cause with at least
// one other deviation in that same window. There's no dedicated "recurring
// issue" flag in the schema, so repeated root-cause text is the closest
// real signal available.
export async function getRecurrenceRate(
  range?: DashboardDateRange,
): Promise<number> {
  const hasRange = Boolean(range?.startDate || range?.endDate);
  const { clause, values } = buildDateFilter(range);
  // Default window (no calendar filter selected): last 90 days. Once the
  // user picks a date range, that range replaces the rolling window.
  const windowClause = hasRange
    ? clause
    : ` AND created_at >= NOW() - INTERVAL '90 days'`;
  const result = await pool.query(
    `
    WITH recent AS (
      SELECT LOWER(TRIM(rca->>'primary_root_cause')) AS root_cause
      FROM deviation_cases
      WHERE rca->>'primary_root_cause' IS NOT NULL
        AND TRIM(rca->>'primary_root_cause') <> ''${windowClause}
    ),
    grouped AS (
      SELECT root_cause, COUNT(*) AS cnt
      FROM recent
      GROUP BY root_cause
    )
    SELECT
      (SELECT COUNT(*) FROM recent) AS total,
      COALESCE(SUM(CASE WHEN cnt > 1 THEN cnt ELSE 0 END), 0) AS repeats
    FROM grouped
  `,
    values,
  );
  const { total, repeats } = result.rows[0];
  const totalNum = Number(total);
  if (totalNum === 0) return 0;
  return (Number(repeats) / totalNum) * 100;
}

// --- CAPA effectiveness ----------------------------------------------------
// Proxy metric: of deviations where CAPA was flagged as required, what share
// made it through the full pipeline (completed_pending_human_review) rather
// than halting for human review. There's no separate "verified effective"
// flag on closed CAPAs in the schema, so pipeline completion is used as the
// closest real signal.
export async function getCapaEffectiveness(
  range?: DashboardDateRange,
): Promise<number> {
  const { clause, values } = buildDateFilter(range);
  const result = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE capa->>'capa_required' = 'true') AS required,
      COUNT(*) FILTER (
        WHERE capa->>'capa_required' = 'true'
          AND status = 'completed_pending_human_review'
      ) AS effective
    FROM deviation_cases
    WHERE true${clause}
  `,
    values,
  );
  const { required, effective } = result.rows[0];
  const requiredNum = Number(required);
  if (requiredNum === 0) return 0;
  return (Number(effective) / requiredNum) * 100;
}

// --- Recent records ---------------------------------------------------
const SEVERITY_RANK: Record<string, number> = {
  Critical: 4,
  Major: 3,
  Minor: 2,
  None: 1,
};

function deviationSeverity(impactAssessment: any): "High" | "Medium" | "Low" {
  if (!impactAssessment) return "Medium";
  const params = [
    impactAssessment.product_impact,
    impactAssessment.patient_impact,
    impactAssessment.data_integrity_impact,
    impactAssessment.compliance_impact,
  ];
  let worst = "None";
  for (const p of params) {
    const sev = p?.severity;
    if (sev && (SEVERITY_RANK[sev] ?? 0) > (SEVERITY_RANK[worst] ?? 0)) {
      worst = sev;
    }
  }
  if (worst === "Critical") return "High";
  if (worst === "Major") return "Medium";
  return "Low";
}

function changeControlSeverity(
  riskCriticality: any,
  changeImpactAssessment: any,
): "High" | "Medium" | "Low" {
  const level =
    riskCriticality?.patient_safety_product_quality_impact?.level ??
    changeImpactAssessment?.risk_scoring;
  if (level === "High") return "High";
  if (level === "Moderate") return "Medium";
  if (level === "Low") return "Low";
  return "Medium";
}

const STATUS_LABELS: Record<string, string> = {
  halted_for_human_review: "Pending",
  completed_pending_human_review: "Completed",
};

function statusLabel(status: unknown): string {
  return STATUS_LABELS[String(status)] ?? String(status ?? "Unknown");
}

function truncateTitle(query: unknown, max = 90): string {
  const text = typeof query === "string" ? query : "";
  const firstLine = text.split("\n")[0].trim();
  if (firstLine.length <= max) return firstLine || "Untitled event";
  return `${firstLine.slice(0, max).trim()}\u2026`;
}

function formatDisplayId(
  id: number | string,
  createdAt: string,
  caseType: "Deviation" | "Change Control",
): string {
  const year = new Date(createdAt).getFullYear();
  const prefix = caseType === "Deviation" ? "DEV" : "CC";
  return `${prefix}-${year}-${String(id).padStart(4, "0")}`;
}

export async function getRecentRecords(
  limit = 5,
  range?: DashboardDateRange,
): Promise<DashboardRecentRecord[]> {
  const { clause, values } = buildDateFilter(range);
  const [devResult, ccResult] = await Promise.all([
    pool.query(
      `SELECT id, query, impact_assessment, status, created_at
       FROM deviation_cases
       WHERE true${clause}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1}`,
      [...values, limit],
    ),
    pool.query(
      `SELECT id, query, risk_criticality, change_impact_assessment, status, created_at
       FROM change_control_cases
       WHERE true${clause}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1}`,
      [...values, limit],
    ),
  ]);

  const deviations: DashboardRecentRecord[] = devResult.rows.map((row) => ({
    id: formatDisplayId(row.id, row.created_at, "Deviation"),
    severity: deviationSeverity(row.impact_assessment),
    title: truncateTitle(row.query),
    status: statusLabel(row.status),
    createdAt: row.created_at,
    caseType: "Deviation" as const,
  }));

  const changeControls: DashboardRecentRecord[] = ccResult.rows.map(
    (row) => ({
      id: formatDisplayId(row.id, row.created_at, "Change Control"),
      severity: changeControlSeverity(
        row.risk_criticality,
        row.change_impact_assessment,
      ),
      title: truncateTitle(row.query),
      status: statusLabel(row.status),
      createdAt: row.created_at,
      caseType: "Change Control" as const,
    }),
  );

  return [...deviations, ...changeControls]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Chart data for the Dashboard page
// ---------------------------------------------------------------------------

// --- Chart: Events by Type (donut) ------------------------------------------
export interface ChartDonutDatum {
  label: string;
  value: number;
}

export function buildEventsByTypeChart(
  counts: DashboardCounts,
): ChartDonutDatum[] {
  return [
    { label: "Deviation", value: counts.totalDeviations },
    { label: "Change Control", value: counts.totalChangeControls },
  ];
}

// --- Chart: Events Over Time (last 2 months by default; adapts to the
// selected calendar range) --------------------------------------------------
// Granularity rules:
//  - No range, or a range spanning more than one calendar month: bucket by
//    month, labelled with the year (e.g. "Jan 2026") since a multi-month
//    span can cross year boundaries.
//  - A range where start and end both fall within the same calendar month:
//    bucket by day, labelled as a date (e.g. "Jul 5") so the chart shows
//    day-by-day movement within that month instead of one flat monthly bar.
export interface EventsOverTimeRow {
  label: string; // "Jan 2026" (monthly) or "Jul 5" (daily)
  allEvents: number;
  deviation: number;
  changeControl: number;
}

export interface EventsOverTimeResult {
  granularity: "month" | "day";
  rows: EventsOverTimeRow[];
}

export async function getEventsOverTime(
  range?: DashboardDateRange,
): Promise<EventsOverTimeResult> {
  const hasRange = Boolean(range?.startDate || range?.endDate);

  const rangeStart = range?.startDate
    ? new Date(`${range.startDate}T00:00:00`)
    : null;
  const rangeEnd = range?.endDate
    ? new Date(`${range.endDate}T00:00:00`)
    : null;

  const now = new Date();

  // Day-level granularity only kicks in when BOTH bounds are selected and
  // they land in the same calendar month/year.
  const sameMonth =
    Boolean(rangeStart && rangeEnd) &&
    rangeStart!.getFullYear() === rangeEnd!.getFullYear() &&
    rangeStart!.getMonth() === rangeEnd!.getMonth();

  const { clause, values } = hasRange
    ? buildDateFilter(range)
    : {
        clause: ` AND created_at >= $1::date`,
        values: [dateToYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1))],
      };

  if (sameMonth) {
    const [devResult, ccResult] = await Promise.all([
      pool.query(
        `
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket,
               COUNT(*) AS cnt
        FROM deviation_cases
        WHERE true${clause}
        GROUP BY 1
      `,
        values,
      ),
      pool.query(
        `
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket,
               COUNT(*) AS cnt
        FROM change_control_cases
        WHERE true${clause}
        GROUP BY 1
      `,
        values,
      ),
    ]);

    const devMap = new Map<string, number>(
      devResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
    );
    const ccMap = new Map<string, number>(
      ccResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
    );

    // Every day between rangeStart and rangeEnd inclusive, capped at 31 so
    // an unexpectedly wide "same month" edge case can't blow up the
    // response.
    const days: { bucket: string; label: string }[] = [];
    const cursor = new Date(
      rangeStart!.getFullYear(),
      rangeStart!.getMonth(),
      rangeStart!.getDate(),
    );
    const end = new Date(
      rangeEnd!.getFullYear(),
      rangeEnd!.getMonth(),
      rangeEnd!.getDate(),
    );
    let guard = 0;
    while (cursor <= end && guard < 31) {
      const bucket = dateToYMD(cursor);
      // dd/mm/yy so the year is always visible on daily-granularity labels.
      const dd = String(cursor.getDate()).padStart(2, "0");
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const yy = String(cursor.getFullYear()).slice(-2);
      const label = `${dd}/${mm}/${yy}`;
      days.push({ bucket, label });
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }

    return {
      granularity: "day",
      rows: days.map(({ bucket, label }) => {
        const deviation = devMap.get(bucket) ?? 0;
        const changeControl = ccMap.get(bucket) ?? 0;
        return {
          label,
          deviation,
          changeControl,
          allEvents: deviation + changeControl,
        };
      }),
    };
  }

  // Monthly granularity (default window, or a multi-month range).
  const windowStart =
    rangeStart ?? new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const windowEnd = rangeEnd ?? now;

  const [devResult, ccResult] = await Promise.all([
    pool.query(
      `
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket,
             COUNT(*) AS cnt
      FROM deviation_cases
      WHERE true${clause}
      GROUP BY 1
    `,
      values,
    ),
    pool.query(
      `
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket,
             COUNT(*) AS cnt
      FROM change_control_cases
      WHERE true${clause}
      GROUP BY 1
    `,
      values,
    ),
  ]);

  const devMap = new Map<string, number>(
    devResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
  );
  const ccMap = new Map<string, number>(
    ccResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
  );

  // Build every calendar month between windowStart and windowEnd
  // (oldest -> newest) so gaps are shown as zero instead of being
  // silently skipped. Capped at 24 months so an accidentally huge range
  // doesn't blow up the response.
  const months: { bucket: string; label: string }[] = [];
  const cursor = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
  const end = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
  let guard = 0;
  while (cursor <= end && guard < 24) {
    const bucket = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const label = cursor.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push({ bucket, label });
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }

  return {
    granularity: "month",
    rows: months.map(({ bucket, label }) => {
      const deviation = devMap.get(bucket) ?? 0;
      const changeControl = ccMap.get(bucket) ?? 0;
      return {
        label,
        deviation,
        changeControl,
        allEvents: deviation + changeControl,
      };
    }),
  };
}

// --- Chart: Events by Site --------------------------------------------------
// Site now comes from the structured `metadata` column (populated at
// creation time by parseQueryMetadata, and backfilled for existing rows —
// see scripts/backfillQueryMetadata.ts).
export interface EventsBySiteRow {
  site: string;
  count: number;
}

export async function getEventsBySite(
  range?: DashboardDateRange,
): Promise<EventsBySiteRow[]> {
  const { clause, values } = buildDateFilter(range);
  const result = await pool.query(
    `
    SELECT metadata->>'site' AS site, COUNT(*) AS cnt
    FROM (
      SELECT metadata, created_at FROM deviation_cases
      UNION ALL
      SELECT metadata, created_at FROM change_control_cases
    ) t
    WHERE metadata->>'site' IS NOT NULL AND metadata->>'site' <> ''${clause}
    GROUP BY metadata->>'site'
    ORDER BY cnt DESC
  `,
    values,
  );
  return result.rows.map((r) => ({ site: r.site, count: Number(r.cnt) }));
}

// --- Chart: Severity Distribution (combined, both case types) --------------
// Computed entirely in SQL (no per-row JS classification) so it stays cheap
// at scale. Mirrors the same classification rules as deviationSeverity /
// changeControlSeverity above. Only High/Medium/Low are surfaced — cases
// that would previously have fallen into "Informational" are folded into
// Low instead.
export type SeverityTally = Record<"High" | "Medium" | "Low", number>;

function severityDistributionSql(clause: string): string {
  return `
  WITH dev_severity AS (
    SELECT
      CASE GREATEST(
        CASE impact_assessment->'product_impact'->>'severity'
          WHEN 'Critical' THEN 4 WHEN 'Major' THEN 3 WHEN 'Minor' THEN 2 ELSE 1 END,
        CASE impact_assessment->'patient_impact'->>'severity'
          WHEN 'Critical' THEN 4 WHEN 'Major' THEN 3 WHEN 'Minor' THEN 2 ELSE 1 END,
        CASE impact_assessment->'data_integrity_impact'->>'severity'
          WHEN 'Critical' THEN 4 WHEN 'Major' THEN 3 WHEN 'Minor' THEN 2 ELSE 1 END,
        CASE impact_assessment->'compliance_impact'->>'severity'
          WHEN 'Critical' THEN 4 WHEN 'Major' THEN 3 WHEN 'Minor' THEN 2 ELSE 1 END
      )
        WHEN 4 THEN 'High'
        WHEN 3 THEN 'Medium'
        ELSE 'Low'
      END AS severity
    FROM deviation_cases
    WHERE true${clause}
  ),
  cc_severity AS (
    SELECT
      CASE COALESCE(
        risk_criticality->'patient_safety_product_quality_impact'->>'level',
        change_impact_assessment->>'risk_scoring'
      )
        WHEN 'High' THEN 'High'
        WHEN 'Moderate' THEN 'Medium'
        WHEN 'Low' THEN 'Low'
        WHEN 'None' THEN 'Low'
        -- Missing/unrecognized risk data defaults to Medium, matching the
        -- original conservative fallback so under-assessed change
        -- controls aren't hidden in the low-risk bucket.
        ELSE 'Medium'
      END AS severity
    FROM change_control_cases
    WHERE true${clause}
  ),
  combined AS (
    SELECT severity FROM dev_severity
    UNION ALL
    SELECT severity FROM cc_severity
  )
  SELECT severity, COUNT(*) AS cnt
  FROM combined
  GROUP BY severity
`;
}

export async function getSeverityDistribution(
  range?: DashboardDateRange,
): Promise<SeverityTally> {
  const { clause, values } = buildDateFilter(range);
  const result = await pool.query(severityDistributionSql(clause), values);

  const tally: SeverityTally = {
    High: 0,
    Medium: 0,
    Low: 0,
  };
  for (const row of result.rows) {
    const key = row.severity as keyof SeverityTally;
    if (key in tally) {
      tally[key] = Number(row.cnt);
    }
  }
  return tally;
}

// --- Chart: Events by Status (combined, both case types) -------------------
export type StatusTally = Record<string, number>;

export async function getEventsByStatusDistribution(
  range?: DashboardDateRange,
): Promise<StatusTally> {
  const { clause, values } = buildDateFilter(range);
  const result = await pool.query(
    `
    SELECT status, COUNT(*) AS cnt
    FROM (
      SELECT status, created_at FROM deviation_cases
      UNION ALL
      SELECT status, created_at FROM change_control_cases
    ) t
    WHERE true${clause}
    GROUP BY status
  `,
    values,
  );

  const tally: StatusTally = {};
  for (const row of result.rows) {
    const label = statusLabel(row.status);
    tally[label] = (tally[label] ?? 0) + Number(row.cnt);
  }
  return tally;
}