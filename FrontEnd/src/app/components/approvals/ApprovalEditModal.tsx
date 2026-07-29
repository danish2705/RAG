import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Database,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
} from "lucide-react";
import type { AnyCase, ApprovalStatus } from "../../types/Records";
import { formatTimestamp } from "../../utils/timezone";

/** Small status pill shared by the modal header and the tables. */
export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const config: Record<
    ApprovalStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    pending: {
      label: "Submitted",
      className:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    in_review: {
      label: "In Review",
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      icon: <Eye className="h-3 w-3 mr-1" />,
    },
    rejected: {
      label: "Rejected",
      className:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
    approved: {
      label: "Approved",
      className:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
  };
  const c = config[status] ?? config.pending;
  return (
    <Badge
      className={`text-xs px-2.5 py-0.5 font-medium shadow-none ${c.className}`}
    >
      {c.icon}
      {c.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ *
 * Small immutable path setter — updates a deep value without mutating
 * the source object, so React state changes are detected reliably.
 * ------------------------------------------------------------------ */
function setPath(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  clone[head] = setPath(obj?.[head], rest, value);
  return clone;
}

/* ------------------------------------------------------------------ *
 * Reusable field editors — plain, theme-aware (reuse shadcn controls).
 * ------------------------------------------------------------------ */

function EditableText({
  label,
  value,
  onChange,
  disabled,
  multiline = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {multiline ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="min-h-[72px] text-sm bg-muted/30"
        />
      ) : (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="text-sm bg-muted/30"
        />
      )}
    </div>
  );
}

function EditableSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="text-sm bg-muted/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EditableList({
  label,
  items,
  onChange,
  disabled,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
}) {
  const list = items ?? [];
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Textarea
              value={item}
              onChange={(e) => {
                const next = [...list];
                next[i] = e.target.value;
                onChange(next);
              }}
              disabled={disabled}
              className="min-h-[44px] text-sm bg-muted/30"
            />
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(list.filter((_, idx) => idx !== i))}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([...list, ""])}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

const SEVERITY = ["None", "Minor", "Major", "Critical"];
const RISK = ["Low", "Moderate", "High"];

/* ------------------------------------------------------------------ *
 * The modal.
 * ------------------------------------------------------------------ */
export function ApprovalEditModal({
  record,
  readOnly = false,
  mode = "approve",
  isApproving = false,
  approveError = null,
  isRejecting = false,
  rejectError = null,
  onClose,
  onApprove,
  onReject,
  onResubmit,
}: {
  record: AnyCase;
  /** Approved cases open read-only (no edits, no Approve button). */
  readOnly?: boolean;
  /** "approve": approver's review screen (Approve/Reject).
   *  "resubmit": submitter editing a rejected case to send it back. */
  mode?: "approve" | "resubmit";
  isApproving?: boolean;
  approveError?: string | null;
  isRejecting?: boolean;
  rejectError?: string | null;
  onClose: () => void;
  onApprove?: (
    id: string,
    caseType: "Deviation" | "Change Control",
    updates: Record<string, unknown>,
  ) => void;
  onReject?: (
    id: string,
    caseType: "Deviation" | "Change Control",
    reason: string,
  ) => void;
  onResubmit?: (
    id: string,
    caseType: "Deviation" | "Change Control",
    updates: Record<string, unknown>,
  ) => void;
}) {
  // Deep-clone once into local editable state.
  const initial = useMemo(() => JSON.parse(JSON.stringify(record)), [record]);
  const [data, setData] = useState<any>(initial);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectValidationError, setRejectValidationError] = useState("");

  const update = (path: (string | number)[], value: any) =>
    setData((prev: any) => setPath(prev, path, value));

  const isDeviation = record.case_type === "Deviation";

  const buildUpdates = (): Record<string, unknown> => {
    const updates: Record<string, unknown> = { query: data.query };
    if (isDeviation) {
      updates.classification = data.classification;
      updates.impact_assessment = data.impact_assessment;
      updates.rca = data.rca;
      updates.capa = data.capa;
    } else {
      updates.classification = data.classification;
      updates.change_impact_assessment = data.change_impact_assessment;
      updates.risk_criticality = data.risk_criticality;
      updates.validation_testing = data.validation_testing;
      updates.implementation_control = data.implementation_control;
      updates.final_summary = data.final_summary;
    }
    return updates;
  };

  const handleApprove = () => {
    onApprove?.(String(record.id), record.case_type, buildUpdates());
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setRejectValidationError("Please explain what needs to be corrected.");
      return;
    }
    onReject?.(String(record.id), record.case_type, rejectReason.trim());
  };

  const handleResubmit = () => {
    onResubmit?.(String(record.id), record.case_type, buildUpdates());
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-none sm:!max-w-none w-[70vw] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-card shadow-2xl rounded-xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-200 dark:border-blue-800 shrink-0">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2 truncate">
                <span className="truncate">
                  Case #{record.id} —{" "}
                  {readOnly
                    ? "Approved Summary"
                    : mode === "resubmit"
                      ? "Edit & Resubmit"
                      : "Review & Approve"}
                </span>
                <ApprovalStatusBadge
                  status={(record.approval_status as any) || "pending"}
                />
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Submitted by{" "}
                <span className="font-medium text-foreground">
                  {record.saved_by}
                </span>
                {" · to "}
                <span className="font-medium text-foreground">
                  {record.submitted_to ?? "—"}
                </span>
                {" · "}
                {formatTimestamp(record.created_at)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable editable body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Rejection banner — shown whenever this case carries a rejection
              reason (either being resubmitted, or an approver re-opening it
              for transparency). */}
          {record.approval_status === "rejected" && record.rejection_reason && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 px-4 py-3 flex gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Rejected by {record.rejected_by || "the approver"}
                  {record.rejected_at
                    ? ` · ${formatTimestamp(record.rejected_at)}`
                    : ""}
                </p>
                <p className="text-sm text-red-700/90 dark:text-red-400/90 mt-1 whitespace-pre-wrap">
                  {record.rejection_reason}
                </p>
              </div>
            </div>
          )}

          <SectionCard title="Original Query">
            <EditableText
              label="Query"
              value={data.query}
              onChange={(v) => update(["query"], v)}
              disabled={readOnly}
            />
          </SectionCard>

          {/* Classification — shared by both case types */}
          {data.classification && (
            <SectionCard title="Classification">
              <EditableSelect
                label="Type"
                value={data.classification.classification}
                options={["Deviation", "Change Control", "Hybrid"]}
                onChange={(v) =>
                  update(["classification", "classification"], v)
                }
                disabled={readOnly}
              />
              <EditableList
                label="AI Rationale"
                items={data.classification.rationale}
                onChange={(v) => update(["classification", "rationale"], v)}
                disabled={readOnly}
              />
            </SectionCard>
          )}

          {isDeviation ? (
            <DeviationSections
              data={data}
              update={update}
              readOnly={readOnly}
            />
          ) : (
            <ChangeControlSections
              data={data}
              update={update}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Inline reject reason box */}
        {!readOnly && mode === "approve" && showRejectBox && (
          <div className="px-6 py-4 bg-red-50/60 dark:bg-red-950/20 border-t border-red-200 dark:border-red-900/50 shrink-0 space-y-2">
            <Label className="text-sm font-medium text-red-700 dark:text-red-400">
              Reason for rejection — what needs to be corrected?
            </Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectValidationError) setRejectValidationError("");
              }}
              placeholder="e.g. RCA is missing supporting evidence — please add lab records before resubmitting."
              className="min-h-[72px] text-sm bg-white dark:bg-background"
            />
            {rejectValidationError && (
              <p className="text-xs text-red-600">{rejectValidationError}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/40 border-t border-border flex items-center justify-between shrink-0">
          <p
            className={
              approveError || rejectError
                ? "text-xs text-red-600 font-medium"
                : "text-xs text-muted-foreground"
            }
          >
            {approveError
              ? approveError
              : rejectError
                ? rejectError
                : readOnly
                  ? "This case has already been approved."
                  : mode === "resubmit"
                    ? "Make your corrections, then resubmit for approval."
                    : "Edits are saved when you approve or reject."}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs px-4"
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>

            {!readOnly && mode === "resubmit" && (
              <Button
                onClick={handleResubmit}
                disabled={isApproving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 gap-1.5 disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                    Resubmitting…
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Resubmit for Approval
                  </>
                )}
              </Button>
            )}

            {!readOnly && mode === "approve" && (
              <>
                {showRejectBox ? (
                  <Button
                    onClick={handleReject}
                    disabled={isRejecting}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-6 gap-1.5 disabled:opacity-50"
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                        Rejecting…
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Confirm Rejection
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectBox(true)}
                    disabled={isApproving || isRejecting}
                    className="text-xs px-4 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-6 gap-1.5 disabled:opacity-50"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Approving…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" /> Save &amp; Approve
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * Deviation-specific editable sections
 * ------------------------------------------------------------------ */
function DeviationSections({
  data,
  update,
  readOnly,
}: {
  data: any;
  update: (path: (string | number)[], value: any) => void;
  readOnly: boolean;
}) {
  const imp = data.impact_assessment?.impact_assessment;
  const rca = data.rca;
  const capa = data.capa;

  return (
    <>
      {imp && (
        <SectionCard title="Impact Assessment">
          {Object.entries(imp).map(([key, val]: any) => (
            <div
              key={key}
              className="space-y-3 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold capitalize text-foreground">
                {key.replace(/_/g, " ")}
              </p>
              <EditableSelect
                label="Severity"
                value={val.severity}
                options={SEVERITY}
                onChange={(v) =>
                  update(
                    ["impact_assessment", "impact_assessment", key, "severity"],
                    v,
                  )
                }
                disabled={readOnly}
              />
              <EditableText
                label="Rationale"
                value={val.rationale}
                onChange={(v) =>
                  update(
                    [
                      "impact_assessment",
                      "impact_assessment",
                      key,
                      "rationale",
                    ],
                    v,
                  )
                }
                disabled={readOnly}
              />
            </div>
          ))}
        </SectionCard>
      )}

      {rca && (
        <SectionCard title="Root Cause Analysis">
          <EditableList
            label="Sequence of Events"
            items={rca.sequence_of_events}
            onChange={(v) => update(["rca", "sequence_of_events"], v)}
            disabled={readOnly}
          />
          <EditableText
            label="Immediate Cause"
            value={rca.immediate_cause}
            onChange={(v) => update(["rca", "immediate_cause"], v)}
            disabled={readOnly}
          />
          <EditableText
            label="Primary Root Cause"
            value={rca.primary_root_cause}
            onChange={(v) => update(["rca", "primary_root_cause"], v)}
            disabled={readOnly}
          />
          <EditableList
            label="Contributing Factors"
            items={rca.contributing_factors}
            onChange={(v) => update(["rca", "contributing_factors"], v)}
            disabled={readOnly}
          />
          <EditableList
            label="Supporting Evidence"
            items={rca.evidence}
            onChange={(v) => update(["rca", "evidence"], v)}
            disabled={readOnly}
          />
          <EditableText
            label="Impact Summary"
            value={rca.impact_summary}
            onChange={(v) => update(["rca", "impact_summary"], v)}
            disabled={readOnly}
          />
        </SectionCard>
      )}

      {capa && (
        <SectionCard title="CAPA">
          <EditableSelect
            label="CAPA Required"
            value={capa.capa_required ? "Yes" : "No"}
            options={["Yes", "No"]}
            onChange={(v) => update(["capa", "capa_required"], v === "Yes")}
            disabled={readOnly}
          />
          <EditableList
            label="Corrective Actions"
            items={capa.corrective_actions}
            onChange={(v) => update(["capa", "corrective_actions"], v)}
            disabled={readOnly}
          />
          <EditableList
            label="Preventive Actions"
            items={capa.preventive_actions}
            onChange={(v) => update(["capa", "preventive_actions"], v)}
            disabled={readOnly}
          />
          <EditableText
            label="Effectiveness Check"
            value={capa.effectiveness_check}
            onChange={(v) => update(["capa", "effectiveness_check"], v)}
            disabled={readOnly}
          />
          <EditableText
            label="Due Date"
            value={capa.due_date}
            onChange={(v) => update(["capa", "due_date"], v)}
            disabled={readOnly}
            multiline={false}
          />
        </SectionCard>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Change Control-specific editable sections
 * ------------------------------------------------------------------ */
function ChangeControlSections({
  data,
  update,
  readOnly,
}: {
  data: any;
  update: (path: (string | number)[], value: any) => void;
  readOnly: boolean;
}) {
  const cia = data.change_impact_assessment;
  const risk = data.risk_criticality;
  const val = data.validation_testing;
  const impl = data.implementation_control;

  return (
    <>
      {cia && (
        <SectionCard title="Change Impact Assessment">
          <EditableList
            label="Impacted Systems"
            items={cia.impacted_systems}
            onChange={(v) =>
              update(["change_impact_assessment", "impacted_systems"], v)
            }
            disabled={readOnly}
          />
          <EditableSelect
            label="GxP Classification"
            value={cia.gxp_classification?.value}
            options={["Direct Impact", "Indirect Impact"]}
            onChange={(v) =>
              update(
                ["change_impact_assessment", "gxp_classification", "value"],
                v,
              )
            }
            disabled={readOnly}
          />
          <EditableText
            label="GxP Rationale"
            value={cia.gxp_classification?.rationale}
            onChange={(v) =>
              update(
                ["change_impact_assessment", "gxp_classification", "rationale"],
                v,
              )
            }
            disabled={readOnly}
          />
          <EditableSelect
            label="Validated State Affected"
            value={
              cia.data_validation_impact?.validated_state_affected
                ? "Yes"
                : "No"
            }
            options={["Yes", "No"]}
            onChange={(v) =>
              update(
                [
                  "change_impact_assessment",
                  "data_validation_impact",
                  "validated_state_affected",
                ],
                v === "Yes",
              )
            }
            disabled={readOnly}
          />
          <EditableText
            label="Data Validation Rationale"
            value={cia.data_validation_impact?.rationale}
            onChange={(v) =>
              update(
                [
                  "change_impact_assessment",
                  "data_validation_impact",
                  "rationale",
                ],
                v,
              )
            }
            disabled={readOnly}
          />
          <EditableList
            label="Downstream Dependencies"
            items={cia.downstream_dependencies}
            onChange={(v) =>
              update(["change_impact_assessment", "downstream_dependencies"], v)
            }
            disabled={readOnly}
          />
          <EditableSelect
            label="Risk Level"
            value={cia.risk_scoring?.level}
            options={RISK}
            onChange={(v) =>
              update(["change_impact_assessment", "risk_scoring", "level"], v)
            }
            disabled={readOnly}
          />
          <EditableText
            label="Risk Rationale"
            value={cia.risk_scoring?.rationale}
            onChange={(v) =>
              update(
                ["change_impact_assessment", "risk_scoring", "rationale"],
                v,
              )
            }
            disabled={readOnly}
          />
        </SectionCard>
      )}

      {risk && (
        <SectionCard title="Risk & Criticality">
          {[
            [
              "patient_safety_product_quality_impact",
              "Patient Safety / Product Quality",
            ],
            ["data_integrity_risk", "Data Integrity Risk"],
            ["operational_disruption_risk", "Operational Disruption Risk"],
          ].map(([key, label]) => (
            <div
              key={key}
              className="space-y-3 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <EditableSelect
                label="Level"
                value={risk[key]?.level}
                options={RISK}
                onChange={(v) => update(["risk_criticality", key, "level"], v)}
                disabled={readOnly}
              />
              <EditableText
                label="Rationale"
                value={risk[key]?.rationale}
                onChange={(v) =>
                  update(["risk_criticality", key, "rationale"], v)
                }
                disabled={readOnly}
              />
            </div>
          ))}
          {/* Regulatory impact has an extra list field */}
          {risk.regulatory_impact && (
            <div className="space-y-3 border-b border-border pb-4">
              <p className="text-sm font-semibold text-foreground">
                Regulatory Impact
              </p>
              <EditableSelect
                label="Level"
                value={risk.regulatory_impact.level}
                options={RISK}
                onChange={(v) =>
                  update(["risk_criticality", "regulatory_impact", "level"], v)
                }
                disabled={readOnly}
              />
              <EditableList
                label="Filings / Submissions Affected"
                items={risk.regulatory_impact.filings_or_submissions_affected}
                onChange={(v) =>
                  update(
                    [
                      "risk_criticality",
                      "regulatory_impact",
                      "filings_or_submissions_affected",
                    ],
                    v,
                  )
                }
                disabled={readOnly}
              />
              <EditableText
                label="Rationale"
                value={risk.regulatory_impact.rationale}
                onChange={(v) =>
                  update(
                    ["risk_criticality", "regulatory_impact", "rationale"],
                    v,
                  )
                }
                disabled={readOnly}
              />
            </div>
          )}
          <EditableText
            label="Risk Ranking Justification"
            value={risk.risk_ranking_justification}
            onChange={(v) =>
              update(["risk_criticality", "risk_ranking_justification"], v)
            }
            disabled={readOnly}
          />
        </SectionCard>
      )}

      {val && (
        <SectionCard title="Validation & Testing">
          <EditableSelect
            label="Required Validation Level"
            value={val.required_validation_level?.level}
            options={["None", "Partial", "Full"]}
            onChange={(v) =>
              update(
                ["validation_testing", "required_validation_level", "level"],
                v,
              )
            }
            disabled={readOnly}
          />
          <EditableText
            label="Validation Level Rationale"
            value={val.required_validation_level?.rationale}
            onChange={(v) =>
              update(
                [
                  "validation_testing",
                  "required_validation_level",
                  "rationale",
                ],
                v,
              )
            }
            disabled={readOnly}
          />
          <EditableList
            label="Scenario-based Testing"
            items={val.scenario_based_testing}
            onChange={(v) =>
              update(["validation_testing", "scenario_based_testing"], v)
            }
            disabled={readOnly}
          />
          <EditableList
            label="Regression Scope"
            items={val.regression_scope}
            onChange={(v) =>
              update(["validation_testing", "regression_scope"], v)
            }
            disabled={readOnly}
          />
          <EditableList
            label="UAT Requirements"
            items={val.uat_requirements}
            onChange={(v) =>
              update(["validation_testing", "uat_requirements"], v)
            }
            disabled={readOnly}
          />
          <EditableList
            label="Traceability"
            items={val.traceability}
            onChange={(v) => update(["validation_testing", "traceability"], v)}
            disabled={readOnly}
          />
        </SectionCard>
      )}

      {impl && (
        <SectionCard title="Implementation & Control">
          <EditableList
            label="Required Actions"
            items={impl.required_actions}
            onChange={(v) =>
              update(["implementation_control", "required_actions"], v)
            }
            disabled={readOnly}
          />
          <EditableList
            label="SOP / WI Updates"
            items={impl.sop_wi_updates}
            onChange={(v) =>
              update(["implementation_control", "sop_wi_updates"], v)
            }
            disabled={readOnly}
          />
          <EditableList
            label="Approval Routing"
            items={impl.approval_routing}
            onChange={(v) =>
              update(["implementation_control", "approval_routing"], v)
            }
            disabled={readOnly}
          />
          <EditableText
            label="Implementation Plan"
            value={impl.implementation_plan}
            onChange={(v) =>
              update(["implementation_control", "implementation_plan"], v)
            }
            disabled={readOnly}
          />
          <EditableText
            label="Rollback / Contingency Plan"
            value={impl.rollback_contingency_plan}
            onChange={(v) =>
              update(["implementation_control", "rollback_contingency_plan"], v)
            }
            disabled={readOnly}
          />
        </SectionCard>
      )}
    </>
  );
}
