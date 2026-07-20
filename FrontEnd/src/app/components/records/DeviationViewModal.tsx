import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Sparkles, Database } from "lucide-react";
import type { DeviationCase } from "../../types/Records";
import { PARAMETER_LABELS } from "../../mocks/mockImpactAssessment";
import {
  getClassificationBadgeClass,
  getSeverityBadgeClass,
} from "../../utils/badges";
import { BulletList, ConfidenceBar } from "./RecordsShared";
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
            <span className="font-medium text-foreground">
              {record.saved_by}
            </span>
            {" · "}
            {formatTimestamp(record.created_at)}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
