import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertTriangle, Sparkles } from "lucide-react";
import { ModifiedBadge } from "../eventIntake";
import { getSeverityBadgeClass } from "../../utils/deviation/impactAssessment";
import type { AssessmentItem } from "../../hooks/deviation/useImpactAssessmentReview";

export const NoImpactDataGuard: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">No impact assessment data found.</p>
        <p className="text-sm text-muted-foreground mt-1">Please go back and submit a quality event first.</p>
        <Button className="mt-4" onClick={onGoBack}>Go Back</Button>
      </CardContent>
    </Card>
  </div>
);

export const ImpactConfidenceCard: React.FC<{ score: number; classificationName: string }> = ({ score, classificationName }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        Overall AI Confidence Score
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Based on {classificationName} classification</span>
        <span className="text-sm font-semibold text-foreground">{score}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </CardContent>
  </Card>
);

interface ImpactAssessmentCardProps {
  assessment: AssessmentItem;
  index: number;
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  onSeverityChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
}

export const ImpactAssessmentCard: React.FC<ImpactAssessmentCardProps> = ({
  assessment, index, isOverrideEditing, overrideConfirmed, onSeverityChange, onDescriptionChange
}) => {
  const isSeverityModified = overrideConfirmed && assessment.severity !== assessment.originalSeverity;
  const isDescriptionModified = overrideConfirmed && assessment.description !== assessment.originalDescription;
  const isAnyModified = isSeverityModified || isDescriptionModified;

  return (
    <Card className={`shadow-sm ${assessment.severityChangedWithoutDescription && isOverrideEditing ? "ring-2 ring-orange-400" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {assessment.category}
          {!isOverrideEditing && isAnyModified && <ModifiedBadge />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOverrideEditing ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Impact Level</label>
              <Select value={assessment.severity} onValueChange={(value) => onSeverityChange(index, value)}>
                <SelectTrigger className={getSeverityBadgeClass(assessment.severity)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">🔴 Critical</SelectItem>
                  <SelectItem value="Major">🟡 Major</SelectItem>
                  <SelectItem value="Minor">🟢 Minor</SelectItem>
                  <SelectItem value="None">⚪ None</SelectItem>
                </SelectContent>
              </Select>
              {assessment.severityChangedWithoutDescription && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Please update the description below to explain this change.
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description {assessment.severityChangedWithoutDescription && <span className="text-orange-600 ml-1">*</span>}
              </label>
              <Textarea
                rows={4}
                value={assessment.description}
                onChange={(e) => onDescriptionChange(index, e.target.value)}
                placeholder="Explain the reason for this change..."
                className={assessment.severityChangedWithoutDescription ? "border-orange-400 focus:ring-orange-400" : ""}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(assessment.severity)}`}>
                {assessment.severity}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{assessment.description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface DescriptionWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warningCards: string[];
}

export const DescriptionWarningDialog: React.FC<DescriptionWarningDialogProps> = ({ open, onOpenChange, warningCards }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" /> Description Update Required
        </DialogTitle>
        <DialogDescription>
          You changed the impact level for the following {warningCards.length === 1 ? "category" : "categories"} but have not updated the description to explain the change:
        </DialogDescription>
      </DialogHeader>
      <ul className="mt-2 space-y-1">
        {warningCards.map((c) => (
          <li key={c} className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
            {c}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground mt-3">
        Please update the description for each changed category with the reason for the new impact level before saving.
      </p>
      <DialogFooter>
        <Button onClick={() => onOpenChange(false)} className="bg-orange-600 hover:bg-orange-700 text-white">
          Go Back & Update
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);