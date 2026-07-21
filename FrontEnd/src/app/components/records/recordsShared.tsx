export function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 w-fit">
        None
      </span>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((point, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          {point}
        </li>
      ))}
    </ul>
  );
}

export function ConfidenceBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          AI Confidence Score
        </span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// Turns e.g. "gxp_classification" or "product_impact" into "Gxp
// Classification" / "Product Impact" for readable plain-text output.
function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Recursively renders any value (string, boolean, array, nested object)
// into indented plain-text lines. Used so the downloaded summary always
// includes every field a pipeline stage has, without needing a hand-written
// formatter per field.
function renderValueLines(value: unknown, indent: string): string[] {
  if (value === null || value === undefined || value === "") {
    return [`${indent}—`];
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${indent}—`];
    return value.map((item) =>
      typeof item === "object" && item !== null
        ? renderValueLines(item, indent).join("\n")
        : `${indent}- ${String(item)}`,
    );
  }

  if (typeof value === "object") {
    const lines: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "confidence_score") continue; // surfaced separately per section
      if (v === null || v === undefined) continue;
      if (typeof v === "object") {
        lines.push(`${indent}${humanizeKey(k)}:`);
        lines.push(...renderValueLines(v, indent + "  "));
      } else {
        lines.push(`${indent}${humanizeKey(k)}: ${String(v)}`);
      }
    }
    return lines.length ? lines : [`${indent}—`];
  }

  return [`${indent}${String(value)}`];
}

function renderSection(title: string, data: unknown): string[] {
  if (!data) return [];
  const lines = [`--- ${title.toUpperCase()} ---`];
  const confidence = (data as Record<string, unknown>)?.confidence_score;
  if (typeof confidence === "number") {
    lines.push(`Confidence Score: ${confidence}%`);
  }
  lines.push(...renderValueLines(data, ""));
  lines.push("");
  return lines;
}

// Builds a full plain-text report covering every pipeline stage present
// on the record — classification, and whichever downstream stages exist
// for that case type (Deviation: impact assessment / rca / capa; Change
// Control: change impact assessment / risk & criticality / validation &
// testing / implementation & control / final summary).
export function buildFullSummaryText(record: any): string {
  const isChangeControl = record.case_type === "Change Control";

  const lines: string[] = [
    "====================================================",
    "           QUALITY MANAGEMENT SYSTEM REPORT          ",
    "====================================================",
    `Record ID:       ${record.id ?? "N/A"}`,
    `Case Type:       ${record.case_type ?? "N/A"}`,
    `Submitted By:    ${record.saved_by ?? "N/A"}`,
    `Status:          ${record.status ?? "N/A"}`,
    "----------------------------------------------------",
    "EVENT QUERY / DESCRIPTION:",
    record.query || "No description provided.",
    "----------------------------------------------------",
  ];

  lines.push(...renderSection("Classification", record.classification));

  if (isChangeControl) {
    lines.push(
      ...renderSection(
        "Change Impact Assessment",
        record.change_impact_assessment,
      ),
    );
    lines.push(...renderSection("Risk & Criticality", record.risk_criticality));
    lines.push(
      ...renderSection("Validation & Testing", record.validation_testing),
    );
    lines.push(
      ...renderSection(
        "Implementation & Control",
        record.implementation_control,
      ),
    );
    lines.push(...renderSection("Final Summary", record.final_summary));
  } else {
    lines.push(...renderSection("Impact Assessment", record.impact_assessment));
    lines.push(...renderSection("Root Cause Analysis", record.rca));
    lines.push(...renderSection("CAPA", record.capa));
  }

  lines.push("====================================================");

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
