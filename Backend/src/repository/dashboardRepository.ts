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

export interface DashboardRecentRecord {
  id: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  status: string;
  createdAt: string;
  caseType: "Deviation" | "Change Control";
}

// --- Counts + open cases -----------------------------------------------
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM deviation_cases) AS total_deviations,
      (SELECT COUNT(*) FROM change_control_cases) AS total_change_controls,
      (SELECT COUNT(*) FROM deviation_cases
        WHERE status = 'halted_for_human_review') AS open_deviations,
      (SELECT COUNT(*) FROM change_control_cases
        WHERE status = 'halted_for_human_review') AS open_change_controls
  `);
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
export async function getRecurrenceRate(): Promise<number> {
  const result = await pool.query(`
    WITH recent AS (
      SELECT LOWER(TRIM(rca->>'primary_root_cause')) AS root_cause
      FROM deviation_cases
      WHERE created_at >= NOW() - INTERVAL '90 days'
        AND rca->>'primary_root_cause' IS NOT NULL
        AND TRIM(rca->>'primary_root_cause') <> ''
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
  `);
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
export async function getCapaEffectiveness(): Promise<number> {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE capa->>'capa_required' = 'true') AS required,
      COUNT(*) FILTER (
        WHERE capa->>'capa_required' = 'true'
          AND status = 'completed_pending_human_review'
      ) AS effective
    FROM deviation_cases
  `);
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
  halted_for_human_review: "Pending Review",
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
): Promise<DashboardRecentRecord[]> {
  const [devResult, ccResult] = await Promise.all([
    pool.query(
      `SELECT id, query, impact_assessment, status, created_at
       FROM deviation_cases
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    ),
    pool.query(
      `SELECT id, query, risk_criticality, change_impact_assessment, status, created_at
       FROM change_control_cases
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
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

// --- Chart: Events Over Time (last 6 months, monthly) -----------------------
export interface EventsOverTimeRow {
  month: string; // "Jan", "Feb", ...
  allEvents: number;
  deviation: number;
  changeControl: number;
}

export async function getEventsOverTime(): Promise<EventsOverTimeRow[]> {
  const [devResult, ccResult] = await Promise.all([
    pool.query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket,
             COUNT(*) AS cnt
      FROM deviation_cases
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
    `),
    pool.query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket,
             COUNT(*) AS cnt
      FROM change_control_cases
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '5 months'
      GROUP BY 1
    `),
  ]);

  const devMap = new Map<string, number>(
    devResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
  );
  const ccMap = new Map<string, number>(
    ccResult.rows.map((r) => [r.bucket, Number(r.cnt)]),
  );

  // Build the last 6 calendar months (oldest -> newest) so gaps are shown
  // as zero instead of being silently skipped.
  const months: { bucket: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const bucket = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    months.push({ bucket, label });
  }

  return months.map(({ bucket, label }) => {
    const deviation = devMap.get(bucket) ?? 0;
    const changeControl = ccMap.get(bucket) ?? 0;
    return {
      month: label,
      deviation,
      changeControl,
      allEvents: deviation + changeControl,
    };
  });
}

// --- Chart: Events by Site --------------------------------------------------
// Site now comes from the structured `metadata` column (populated at
// creation time by parseQueryMetadata, and backfilled for existing rows —
// see scripts/backfillQueryMetadata.ts).
export interface EventsBySiteRow {
  site: string;
  count: number;
}

export async function getEventsBySite(): Promise<EventsBySiteRow[]> {
  const result = await pool.query(`
    SELECT metadata->>'site' AS site, COUNT(*) AS cnt
    FROM (
      SELECT metadata FROM deviation_cases
      UNION ALL
      SELECT metadata FROM change_control_cases
    ) t
    WHERE metadata->>'site' IS NOT NULL AND metadata->>'site' <> ''
    GROUP BY metadata->>'site'
    ORDER BY cnt DESC
  `);
  return result.rows.map((r) => ({ site: r.site, count: Number(r.cnt) }));
}

// --- Chart: Severity Distribution (combined, both case types) --------------
// Computed entirely in SQL (no per-row JS classification) so it stays cheap
// at scale. Mirrors the same classification rules as deviationSeverity /
// changeControlSeverity above. Only High/Medium/Low are surfaced — cases
// that would previously have fallen into "Informational" are folded into
// Low instead.
export type SeverityTally = Record<"High" | "Medium" | "Low", number>;

const SEVERITY_DISTRIBUTION_SQL = `
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

export async function getSeverityDistribution(): Promise<SeverityTally> {
  const result = await pool.query(SEVERITY_DISTRIBUTION_SQL);

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

export async function getEventsByStatusDistribution(): Promise<StatusTally> {
  const result = await pool.query(`
    SELECT status, COUNT(*) AS cnt
    FROM (
      SELECT status FROM deviation_cases
      UNION ALL
      SELECT status FROM change_control_cases
    ) t
    GROUP BY status
  `);

  const tally: StatusTally = {};
  for (const row of result.rows) {
    const label = statusLabel(row.status);
    tally[label] = (tally[label] ?? 0) + Number(row.cnt);
  }
  return tally;
}