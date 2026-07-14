import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AlertTriangle, Sparkles } from "lucide-react";
import { ModifiedBadge } from "../eventIntake";

// Styling aligned with the reference image badges
export function getGxpBadgeClass(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("no impact"))
    return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  if (v.includes("indirect"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  if (v.includes("direct"))
    return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  return "bg-muted text-muted-foreground border border-border";
}

export function getRiskLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "moderate":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "low":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

export function getValidationImpactBadgeClass(affected: boolean): string {
  return affected
    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
}

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const NoImpactAssessmentDataGuard: React.FC<{
  onGoBack: () => void;
}> = ({ onGoBack }) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">
          No change impact assessment data found.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and submit a quality event first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const ImpactConfidenceCard = React.memo<{ score: number }>(
  ({ score }) => (
    <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Overall AI Confidence Score
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Based on Change Control classification
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={`h-full ${
                score >= 80
                  ? "bg-green-500"
                  : score >= 60
                    ? "bg-yellow-400"
                    : "bg-red-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {score}%
          </span>
        </div>
      </CardContent>
    </Card>
  ),
);
ImpactConfidenceCard.displayName = "ImpactConfidenceCard";

export const GxpClassificationCard = React.memo<{
  title: string;
  value: string;
  rationale: string;
  isOverrideEditing: boolean;
  isModified: boolean;
  changedWithoutRationale: boolean;
  onValueChange: (value: string) => void;
  onRationaleChange: (value: string) => void;
}>(
  ({
    title,
    value,
    rationale,
    isOverrideEditing,
    isModified,
    changedWithoutRationale,
    onValueChange,
    onRationaleChange,
  }) => (
    <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
      <CardContent className="pt-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 justify-between mb-4">
          <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {!isOverrideEditing && isModified && <ModifiedBadge />}
        </div>

        {isOverrideEditing ? (
          <div className="space-y-3">
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Direct Impact">Direct Impact</SelectItem>
                <SelectItem value="Indirect Impact">Indirect Impact</SelectItem>
              </SelectContent>
            </Select>
            {changedWithoutRationale && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Update rationale below
              </p>
            )}
            <Textarea
              rows={4}
              value={rationale}
              onChange={(e) => onRationaleChange(e.target.value)}
              placeholder="Explain the reason for this change..."
              className={`resize-none text-sm ${changedWithoutRationale ? "border-orange-400" : ""}`}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getGxpBadgeClass(value)}`}
              >
                {value}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
              {rationale || "No rationale provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);
GxpClassificationCard.displayName = "GxpClassificationCard";

export const DataValidationImpactCard = React.memo<{
  title: string;
  validatedStateAffected: boolean;
  rationale: string;
  isOverrideEditing: boolean;
  isModified: boolean;
  changedWithoutRationale: boolean;
  onValueChange: (value: string) => void;
  onRationaleChange: (value: string) => void;
}>(
  ({
    title,
    validatedStateAffected,
    rationale,
    isOverrideEditing,
    isModified,
    changedWithoutRationale,
    onValueChange,
    onRationaleChange,
  }) => (
    <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
      <CardContent className="pt-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 justify-between mb-4">
          <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {!isOverrideEditing && isModified && <ModifiedBadge />}
        </div>

        {isOverrideEditing ? (
          <div className="space-y-3">
            <Select
              value={String(validatedStateAffected)}
              onValueChange={onValueChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Validated State Affected</SelectItem>
                <SelectItem value="false">
                  Validated State Not Affected
                </SelectItem>
              </SelectContent>
            </Select>
            {changedWithoutRationale && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Update rationale below
              </p>
            )}
            <Textarea
              rows={4}
              value={rationale}
              onChange={(e) => onRationaleChange(e.target.value)}
              placeholder="Explain the reason for this change..."
              className={`resize-none text-sm ${changedWithoutRationale ? "border-orange-400" : ""}`}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getValidationImpactBadgeClass(validatedStateAffected)}`}
              >
                {validatedStateAffected ? "Affected" : "None"}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
              {rationale || "No rationale provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);
DataValidationImpactCard.displayName = "DataValidationImpactCard";

export const ImpactListCard = React.memo<{
  title: string;
  items: string[];
  isOverrideEditing: boolean;
  isModified: boolean;
  onChange: (items: string[]) => void;
  placeholder: string;
}>(({ title, items, isOverrideEditing, isModified, onChange, placeholder }) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full">
    <CardContent className="pt-6 flex flex-col flex-1">
      <div className="flex items-center gap-2 justify-between mb-4">
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {!isOverrideEditing && isModified && <ModifiedBadge />}
      </div>

      {isOverrideEditing ? (
        <Textarea
          rows={4}
          value={items.join("\n")}
          onChange={(e) => onChange(parseLines(e.target.value))}
          placeholder={placeholder}
          className="resize-none text-sm"
        />
      ) : (
        <div className="flex flex-col gap-2 flex-1 mt-1">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[13px] text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))
          ) : (
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 w-fit">
              None
            </span>
          )}
        </div>
      )}
    </CardContent>
  </Card>
));
ImpactListCard.displayName = "ImpactListCard";

export const RiskScoringCard = React.memo<{
  title: string;
  level: string;
  rationale: string;
  isOverrideEditing: boolean;
  isModified: boolean;
  changedWithoutRationale: boolean;
  onLevelChange: (value: string) => void;
  onRationaleChange: (value: string) => void;
}>(
  ({
    title,
    level,
    rationale,
    isOverrideEditing,
    isModified,
    changedWithoutRationale,
    onLevelChange,
    onRationaleChange,
  }) => (
    <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full md:col-span-2">
      <CardContent className="pt-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 justify-between mb-4">
          <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {!isOverrideEditing && isModified && <ModifiedBadge />}
        </div>

        {isOverrideEditing ? (
          <div className="space-y-3 md:w-1/2">
            <Select value={level} onValueChange={onLevelChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            {changedWithoutRationale && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Update rationale below
              </p>
            )}
            <Textarea
              rows={3}
              value={rationale}
              onChange={(e) => onRationaleChange(e.target.value)}
              placeholder="Explain the reason for this change..."
              className={`resize-none text-sm ${changedWithoutRationale ? "border-orange-400" : ""}`}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getRiskLevelBadgeClass(level)}`}
              >
                {level}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mt-4">
              {rationale || "No rationale provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);
RiskScoringCard.displayName = "RiskScoringCard";
