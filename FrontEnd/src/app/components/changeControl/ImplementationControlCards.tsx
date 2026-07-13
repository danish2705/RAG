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
}> = ({ score, riskLevel }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        Overall AI Confidence Score
      </CardTitle>
      {riskLevel && (
        <p className="text-xs text-muted-foreground mt-0.5">
          ({riskLevel} System Rationale)
        </p>
      )}
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Based on Implementation &amp; Control Actions
        </span>
        <span className="text-sm font-semibold text-foreground">
          {score}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            score >= 80
              ? "bg-green-500"
              : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
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
  <Card>
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