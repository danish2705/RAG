import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Sparkles, AlertTriangle } from "lucide-react";
import { ModifiedStatus, AlertBanner } from "../eventIntake";

export const NoCapaDataGuard: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No CAPA data found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and complete the root cause analysis first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const CapaConfidenceCard = React.memo<{ score: number }>(({ score }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        Overall AI Confidence Score
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Based on CAPA recommendations
        </span>
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
));
CapaConfidenceCard.displayName = "CapaConfidenceCard";

export const CapaCorrectionCard = React.memo<{
  value: string;
  onChange: (v: string) => void;
}>(({ value, onChange }) => (
  <Card>
    <CardHeader>
      <CardTitle>Correction</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Label htmlFor="correction">
          Immediate Correction (What was done to fix the immediate problem?)
        </Label>
        <Textarea
          id="correction"
          placeholder="Describe the immediate action taken to address this specific deviation..."
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </CardContent>
  </Card>
));
CapaCorrectionCard.displayName = "CapaCorrectionCard";

interface CapaActionCardProps {
  title: string;
  label: string;
  placeholder: string;
  value: string;
  originalValue: string;
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  onChange: (v: string) => void;
  showWarning?: boolean;
}

export const CapaActionCard = React.memo<CapaActionCardProps>(
  ({
    title,
    label,
    placeholder,
    value,
    originalValue,
    isOverrideEditing,
    overrideConfirmed,
    onChange,
    showWarning,
  }) => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title} <Sparkles className="h-5 w-5 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Label>{label}</Label>
              {!isOverrideEditing && (
                <ModifiedStatus
                  enabled={overrideConfirmed}
                  original={originalValue}
                  current={value}
                />
              )}
            </div>
            <Textarea
              placeholder={placeholder}
              rows={5}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={!isOverrideEditing}
              className={!isOverrideEditing ? "bg-muted cursor-default" : ""}
            />
          </div>
        </CardContent>
      </Card>
      {showWarning && (
        <AlertBanner
          type="warning"
          title="CAPA May Be Insufficient"
          message="The corrective action appears to be too brief or generic. Consider providing more specific, measurable actions that directly address the root cause."
        />
      )}
    </>
  ),
);
CapaActionCard.displayName = "CapaActionCard";

interface CapaEffectivenessCardProps {
  checkValue: string;
  originalCheck: string;
  dateValue: string;
  originalDate: string;
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  onCheckChange: (v: string) => void;
  onDateChange: (v: string) => void;
}

export const CapaEffectivenessCard = React.memo<CapaEffectivenessCardProps>(
  ({
    checkValue,
    originalCheck,
    dateValue,
    originalDate,
    isOverrideEditing,
    overrideConfirmed,
    onCheckChange,
    onDateChange,
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Effectiveness Check & Due Date{" "}
          <Sparkles className="h-5 w-5 text-blue-600" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Effectiveness Check</Label>
            {!isOverrideEditing && (
              <ModifiedStatus
                enabled={overrideConfirmed}
                original={originalCheck}
                current={checkValue}
              />
            )}
          </div>
          <Textarea
            rows={3}
            value={checkValue}
            onChange={(e) => onCheckChange(e.target.value)}
            readOnly={!isOverrideEditing}
            className={!isOverrideEditing ? "bg-muted cursor-default" : ""}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Due Date</Label>
            {!isOverrideEditing && (
              <ModifiedStatus
                enabled={overrideConfirmed}
                original={originalDate}
                current={dateValue}
              />
            )}
          </div>
          <Textarea
            rows={1}
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            readOnly={!isOverrideEditing}
            className={!isOverrideEditing ? "bg-muted cursor-default" : ""}
          />
        </div>
      </CardContent>
    </Card>
  ),
);
CapaEffectivenessCard.displayName = "CapaEffectivenessCard";
