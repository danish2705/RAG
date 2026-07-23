import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Database, Download, X } from "lucide-react";
import type { ChangeControlCase } from "../../types/Records";
import { CHANGE_IMPACT_FIELD_LABELS } from "../../mocks/mockImpactAssessment";
import { VALIDATION_TESTING_FIELD_LABELS } from "../../mocks/mockValidationTesting";
import { IMPLEMENTATION_CONTROL_FIELD_LABELS } from "../../mocks/mockImplementation";
import { RISK_FIELD_LABELS } from "../../../constants/records";
import {
  getClassificationBadgeClass,
  getGxpBadgeClass,
  getValidationImpactBadgeClass,
  getValidationLevelBadgeClass,
  getRiskLevelBadgeClass,
} from "../../utils/badges";
import {
  BulletList,
  ConfidenceBar,
  buildFullSummaryText,
  downloadTextFile,
} from "./RecordsShared";
import { formatTimestamp } from "../../utils/timezone";

export function ChangeControlViewModal({
  record,
  onClose,
}: {
  record: ChangeControlCase;
  onClose: () => void;
}) {
  const cls = record.classification;
  const impact = record.change_impact_assessment;
  const risk = record.risk_criticality;
  const validation = record.validation_testing;
  const implementation = record.implementation_control;

  const handleDownloadSummary = () => {
    downloadTextFile(
      `QMS_Summary_${record.id}.txt`,
      buildFullSummaryText({ ...record, case_type: "Change Control" }),
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

          {impact && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Change Impact Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={impact.confidence_score} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {CHANGE_IMPACT_FIELD_LABELS.impacted_systems}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={impact.impacted_systems} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {CHANGE_IMPACT_FIELD_LABELS.gxp_classification}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getGxpBadgeClass(impact.gxp_classification.value)}`}
                    >
                      {impact.gxp_classification.value}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {impact.gxp_classification.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {CHANGE_IMPACT_FIELD_LABELS.data_validation_impact}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getValidationImpactBadgeClass(impact.data_validation_impact.validated_state_affected)}`}
                    >
                      {impact.data_validation_impact.validated_state_affected
                        ? "Validated State Affected"
                        : "Not Affected"}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {impact.data_validation_impact.rationale}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {CHANGE_IMPACT_FIELD_LABELS.downstream_dependencies}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={impact.downstream_dependencies} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {CHANGE_IMPACT_FIELD_LABELS.risk_scoring}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(impact.risk_scoring.level)}`}
                  >
                    {impact.risk_scoring.level} Risk
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {impact.risk_scoring.rationale}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {risk && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Risk &amp; Criticality Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={risk.confidence_score} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {RISK_FIELD_LABELS.patient_safety_product_quality_impact}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(risk.patient_safety_product_quality_impact.level)}`}
                    >
                      {risk.patient_safety_product_quality_impact.level}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {risk.patient_safety_product_quality_impact.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {RISK_FIELD_LABELS.regulatory_impact}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(risk.regulatory_impact.level)}`}
                    >
                      {risk.regulatory_impact.level}
                    </span>
                    <BulletList
                      items={
                        risk.regulatory_impact.filings_or_submissions_affected
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      {risk.regulatory_impact.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {RISK_FIELD_LABELS.data_integrity_risk}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(risk.data_integrity_risk.level)}`}
                    >
                      {risk.data_integrity_risk.level}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {risk.data_integrity_risk.rationale}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {RISK_FIELD_LABELS.operational_disruption_risk}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelBadgeClass(risk.operational_disruption_risk.level)}`}
                    >
                      {risk.operational_disruption_risk.level}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {risk.operational_disruption_risk.rationale}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Risk Ranking Justification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                    {risk.risk_ranking_justification}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {validation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Validation &amp; Testing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={validation.confidence_score} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {VALIDATION_TESTING_FIELD_LABELS.required_validation_level}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getValidationLevelBadgeClass(validation.required_validation_level.level)}`}
                  >
                    {validation.required_validation_level.level}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {validation.required_validation_level.rationale}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {VALIDATION_TESTING_FIELD_LABELS.scenario_based_testing}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={validation.scenario_based_testing} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {VALIDATION_TESTING_FIELD_LABELS.regression_scope}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={validation.regression_scope} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {VALIDATION_TESTING_FIELD_LABELS.uat_requirements}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={validation.uat_requirements} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {VALIDATION_TESTING_FIELD_LABELS.traceability}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={validation.traceability} />
                </CardContent>
              </Card>
            </>
          )}

          {implementation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Implementation &amp; Control Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfidenceBar score={implementation.confidence_score} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {IMPLEMENTATION_CONTROL_FIELD_LABELS.required_actions}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={implementation.required_actions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {IMPLEMENTATION_CONTROL_FIELD_LABELS.sop_wi_updates}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={implementation.sop_wi_updates} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {IMPLEMENTATION_CONTROL_FIELD_LABELS.approval_routing}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BulletList items={implementation.approval_routing} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {IMPLEMENTATION_CONTROL_FIELD_LABELS.implementation_plan}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                    {implementation.implementation_plan}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {
                      IMPLEMENTATION_CONTROL_FIELD_LABELS.rollback_contingency_plan
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">
                    {implementation.rollback_contingency_plan}
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {record.final_summary != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Final Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {typeof record.final_summary === "string" ? (
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                    {record.final_summary}
                  </p>
                ) : (
                  <pre className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3 whitespace-pre-wrap font-mono overflow-x-auto">
                    {JSON.stringify(record.final_summary, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
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