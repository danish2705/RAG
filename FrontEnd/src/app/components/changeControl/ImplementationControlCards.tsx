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
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import {
  ModifiedStatus,
  StepProgressBar,
  type Classification,
} from "../eventIntake";

export const NoChangeControlDataGuard: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">
          No change control data found.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Please go back and start a new submission first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const GeneratingImplementationGuard: React.FC<{
  classification?: Classification;
  isGenerating: boolean;
  generateError: string | null;
  onGoBack: () => void;
}> = ({ classification, isGenerating, generateError, onGoBack }) => (
  <div className="relative h-full w-full">
    <div className="min-h-screen p-6">
      <StepProgressBar classification={classification} />
      <Card>
        <CardContent className="py-12 text-center">
          {isGenerating ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-foreground font-medium">
                Generating implementation &amp; control actions…
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This will only take a moment.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
              <p className="text-foreground font-medium">
                No implementation &amp; control actions found.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {generateError ??
                  "Please go back and complete the Validation & Testing strategy first."}
              </p>
              <Button className="mt-4" onClick={onGoBack}>
                Go Back
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

export const ImplementationConfidenceCard: React.FC<{
  score: number;
  riskLevel: string | null;
}> = ({ score}) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Overall AI Confidence Score
      </CardTitle>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Based on Validation &amp; Testing Strategy
      </p>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4">
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

export const ImplementationTextareaCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  fieldId: string;
  label: string;
  rows: number;
  value: string;
  original: string;
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  onChange: (value: string) => void;
}> = ({
  icon,
  title,
  fieldId,
  label,
  rows,
  value,
  original,
  isOverrideEditing,
  overrideConfirmed,
  onChange,
}) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
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
              original={original}
              current={value}
            />
          )}
        </div>
        <Textarea
          id={fieldId}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={!isOverrideEditing}
          className={!isOverrideEditing ? "bg-muted cursor-default" : ""}
        />
      </div>
    </CardContent>
  </Card>
);