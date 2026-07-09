import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { ModifiedBadge, ModifiedStatus } from "../eventIntake";

// Styling aligned with the sibling RiskCriticality.tsx badges
export function getValidationLevelBadgeClass(level: string): string {
  switch (level.toLowerCase()) {
    case "full":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "partial":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "none":
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

export const NoValidationDataGuard: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">
          No validation &amp; testing strategy data found.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please go back and complete the Risk &amp; Criticality Evaluation
          first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const ValidationConfidenceCard: React.FC<{ score: number }> = ({
  score,
}) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Overall AI Confidence Score
      </CardTitle>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Based on Risk &amp; Criticality Evaluation (risk ranking
        justification reviewed)
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
);

interface ValidationLevelCardProps {
  icon: React.ReactNode;
  title: string;
  level: string;
  levelRationale: string;
  isOverrideEditing: boolean;
  isLevelModified: boolean;
  levelChangedWithoutRationale: boolean;
  onLevelChange: (value: string) => void;
  onRationaleChange: (value: string) => void;
}

export const ValidationLevelCard: React.FC<ValidationLevelCardProps> = ({
  icon,
  title,
  level,
  levelRationale,
  isOverrideEditing,
  isLevelModified,
  levelChangedWithoutRationale,
  onLevelChange,
  onRationaleChange,
}) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 justify-between mb-4">
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {!isOverrideEditing && isLevelModified && <ModifiedBadge />}
      </div>

      {isOverrideEditing ? (
        <div className="space-y-3">
          <Select value={level} onValueChange={onLevelChange}>
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Full">Full</SelectItem>
            </SelectContent>
          </Select>
          {levelChangedWithoutRationale && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Update rationale below
            </p>
          )}
          <Textarea
            rows={3}
            value={levelRationale}
            onChange={(e) => onRationaleChange(e.target.value)}
            placeholder="Explain the reason for this change..."
            className={`resize-none text-sm ${levelChangedWithoutRationale ? "border-orange-400" : ""}`}
          />
        </div>
      ) : (
        <div>
          <span
            className={`inline-flex items-center px-3 py-0.5 rounded-full text-[13px] font-medium ${getValidationLevelBadgeClass(level)}`}
          >
            {level}
          </span>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
            {levelRationale || "No rationale provided."}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

interface ListTextareaCardProps {
  icon: React.ReactNode;
  title: string;
  fieldId: string;
  label: string;
  value: string;
  originalValue: string;
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const ListTextareaCard: React.FC<ListTextareaCardProps> = ({
  icon,
  title,
  fieldId,
  label,
  value,
  originalValue,
  isOverrideEditing,
  overrideConfirmed,
  placeholder,
  onChange,
}) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Label htmlFor={fieldId}>{label}</Label>
          {!isOverrideEditing && (
            <ModifiedStatus
              enabled={overrideConfirmed}
              original={originalValue}
              current={value}
            />
          )}
        </div>
        <Textarea
          id={fieldId}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={!isOverrideEditing}
          className={!isOverrideEditing ? "bg-muted cursor-default" : ""}
          placeholder={placeholder}
        />
      </div>
    </CardContent>
  </Card>
);