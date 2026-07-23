import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Sparkles, Database, Download, X } from "lucide-react";
import type { DeviationCase } from "../../types/Records";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";
import {
  getClassificationBadgeClass,
  getSeverityBadgeClass,
} from "../../utils/badges";
import {
  BulletList,
  ConfidenceBar,
  buildFullSummaryText,
  downloadTextFile,
} from "./RecordsShared";
import { formatTimestamp } from "../../utils/timezone";

export function DeviationViewModal({
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

  const handleDownloadSummary = () => {
    downloadTextFile(
      `QMS_Summary_${record.id}.txt`,
      buildFullSummaryText({ ...record, case_type: "Deviation" }),
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-none sm:!max-w-none w-[70vw] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-card shadow-2xl rounded-xl">
        {/* Sticky Fixed Header with z-50 to ensure it always stays on top during scroll */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-200 dark:border-blue-800 shrink-0">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2 truncate">
                <span className="truncate">Case #{record.id} — Full Summary</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Saved by{" "}
                <span className="font-medium text-foreground">
                  {record.saved_by}
                </span>
                {" · "}
                {formatTimestamp(record.created_at)}
              </p>
            </div>
          </div>

          {/* Right-Aligned Sticky Action Buttons with increased gap-4 and margins */}
          <div className="flex items-center gap-4 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSummary}
              className="bg-background hover:bg-muted font-medium text-xs h-9 px-3.5 border-border shadow-sm flex items-center gap-1.5 mr-1"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Download Summary</span>
            </Button>

            {/* Extreme Right Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Query</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                {record.query}
              </p>
            </CardContent>
          </Card>

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
                  <BulletList items={cls.rationale} />
                </div>
              </CardContent>
            </Card>
          )}

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
                      Sequence of Events
                    </p>
                    <BulletList items={rca.sequence_of_events} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Underlying Root Cause
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                      {rca.primary_root_cause}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Immediate Cause
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                      {rca.immediate_cause}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Contributing Factors
                    </p>
                    <BulletList items={rca.contributing_factors} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Supporting Evidence
                    </p>
                    <BulletList items={rca.evidence} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Impact Summary
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                      {rca.impact_summary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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
                  <CardTitle className="text-base">CAPA Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      capa.capa_required
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {capa.capa_required ? "Yes" : "No"}
                  </span>
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
                  <BulletList items={capa.corrective_actions} />
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
                  <BulletList items={capa.preventive_actions} />
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
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                      {capa.effectiveness_check}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Due Date
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                      {capa.due_date}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-muted/40 border-t border-border flex justify-end shrink-0">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}