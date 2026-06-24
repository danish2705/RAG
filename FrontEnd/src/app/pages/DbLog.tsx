import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Sparkles,
  Database,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { AIAssistant } from "../components/chat/ai-assistant";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────

interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

interface RCAResult {
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_assessment: string;
  confidence_score: number;
}

interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

interface DeviationCase {
  id: number;
  query: string;
  saved_by: string;
  classification: ClassificationParsed | null;
  impact_assessment: ImpactAssessmentParsed | null;
  rca: RCAResult | null;
  capa: CAPAResult | null;
  status: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getClassificationBadgeClass(type: string): string {
  if (type === "Deviation")
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  if (type === "Change Control")
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (type === "Hybrid")
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
  return "bg-muted text-muted-foreground border-border";
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "major":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "minor":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

function ConfidenceBar({ score }: { score: number }) {
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

const PARAMETER_LABELS: Record<string, string> = {
  product_impact: "Product Impact",
  patient_impact: "Patient Impact",
  data_integrity_impact: "Data Integrity Impact",
  compliance_impact: "Compliance Impact",
};

// ── View Modal ─────────────────────────────────────────────────────────────

function CaseViewModal({
  record,
  onClose,
}: {
  record: DeviationCase;
  onClose: () => void;
}) {
  const cls = record.classification;
  const imp = record.impact_assessment;
  const rca = record.rca;
  const capa = record.capa;

  const impactEntries = imp
    ? Object.entries(imp.impact_assessment).map(([key, val]) => ({
        key,
        category: PARAMETER_LABELS[key] ?? key,
        severity: val.severity,
        description: val.rationale,
      }))
    : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-blue-600" />
            Case #{record.id} — Full Summary
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Saved by{" "}
            <span className="font-medium text-foreground">{record.saved_by}</span>
            {" · "}
            {new Date(record.created_at).toLocaleString()}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Query */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Query</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted rounded-md p-3">
                {record.query}
              </p>
            </CardContent>
          </Card>

          {/* Classification */}
          {cls && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Classification
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Type:
                  </span>
                  <Badge
                    className={getClassificationBadgeClass(cls.classification)}
                  >
                    {cls.classification}
                  </Badge>
                </div>
                <ConfidenceBar score={cls.confidence_score} />
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground mb-2">
                    AI Rationale
                  </p>
                  <ul className="space-y-1.5">
                    {cls.rationale.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact Assessment */}
          {imp && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Impact Assessment — Overall Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={imp.confidence_score} />
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {impactEntries.map((entry) => (
                  <Card key={entry.key}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {entry.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadgeClass(entry.severity)}`}
                      >
                        {entry.severity}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* RCA */}
          {rca && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Root Cause Analysis — Overall Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={rca.confidence_score} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Primary Root Cause
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Underlying Root Cause
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                      {rca.primary_root_cause}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Immediate Cause
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                      {rca.immediate_cause}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Contributing Factors
                    </p>
                    <ul className="space-y-1.5">
                      {rca.contributing_factors.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Supporting Evidence
                    </p>
                    <ul className="space-y-1.5">
                      {rca.evidence.map((p, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* CAPA */}
          {capa && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    CAPA — Overall Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={capa.confidence_score} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Corrective Action
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {capa.corrective_actions.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Preventive Action
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {capa.preventive_actions.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    Effectiveness Check & Due Date
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Effectiveness Check
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                      {capa.effectiveness_check}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Due Date
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                      {capa.due_date}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export function DbLog() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<DeviationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<DeviationCase | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [sortField, setSortField] = useState<
    "saved_by" | "classification" | "created_at"
  >("created_at");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [submittedByFilter, setSubmittedByFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cases");
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setCases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cases.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSort = (field: "saved_by" | "classification" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredCases = useMemo(() => {
    let data = [...cases];

    data = data.filter((c) => {
      const matchesSubmittedBy =
        !submittedByFilter ||
        (c.saved_by || "")
          .toLowerCase()
          .includes(submittedByFilter.toLowerCase());

      const matchesClassification =
        classificationFilter === "all" ||
        c.classification?.classification === classificationFilter;

      return matchesSubmittedBy && matchesClassification;
    });

    data.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortField) {
        case "saved_by":
          valueA = a.saved_by || "";
          valueB = b.saved_by || "";
          break;

        case "classification":
          valueA = a.classification?.classification || "";
          valueB = b.classification?.classification || "";
          break;

        case "created_at":
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return sortDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

    return data;
  }, [cases, submittedByFilter, classificationFilter, sortField, sortDirection]);

  return (
    <div className="p-6 w-full">
      {selectedCase && (
        <CaseViewModal
          record={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      <div className="mb-6 flex items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredCases.length} case{filteredCases.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => navigate("/deviation")}
        >
          + New Case
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search submitted by, query…"
            value={submittedByFilter}
            onChange={(e) => setSubmittedByFilter(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <Select
          value={classificationFilter}
          onValueChange={setClassificationFilter}
        >
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Deviation">Deviation</SelectItem>
            <SelectItem value="Change Control">Change Control</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground whitespace-nowrap pl-1">
          {filteredCases.length} result{filteredCases.length === 1 ? "" : "s"}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-muted-foreground text-sm">Loading records…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
              <p className="text-foreground font-medium">Could not load cases</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No records yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Saved cases will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="w-20 font-semibold text-foreground">
                    UI ID
                  </TableHead>

                  <TableHead className="font-semibold text-foreground">
                    <button
                      onClick={() => handleSort("saved_by")}
                      className="flex items-center gap-2"
                    >
                      Submitted By
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>

                  <TableHead className="font-semibold text-foreground">
                    Query
                  </TableHead>

                  <TableHead className="font-semibold text-foreground">
                    <button
                      onClick={() => handleSort("classification")}
                      className="flex items-center gap-2"
                    >
                      Classification
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>

                  <TableHead className="font-semibold text-foreground">
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center gap-2"
                    >
                      Saved On
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>

                  <TableHead className="w-24 text-center font-semibold text-foreground">
                    View
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow
                    key={c.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      #{String(c.id).padStart(4, "0")}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">
                      {c.saved_by || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">
                      <span className="line-clamp-2">{c.query}</span>
                    </TableCell>
                    <TableCell>
                      {c.classification ? (
                        <Badge
                          className={`text-xs ${getClassificationBadgeClass(c.classification.classification)}`}
                        >
                          {c.classification.classification}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                        onClick={() => setSelectedCase(c)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}