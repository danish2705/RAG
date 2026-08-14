import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { AlertTriangle, Sparkles } from "lucide-react";
import { ModifiedStatus } from "../eventIntake";
import { SourcesUsed } from "../shared/SourcesUsed";

export const NoRcaDataGuard: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">No root cause analysis data found.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Please go back and complete the impact assessment first.</p>
        <Button className="mt-4" onClick={onGoBack}>Go Back</Button>
      </CardContent>
    </Card>
  </div>
);

export const RcaConfidenceCard: React.FC<{
  score: number;
  onGetAiSuggestion?: () => void;
}> = ({ score, onGetAiSuggestion }) => (
  <Card className="shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <CardTitle className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        Overall AI Confidence Score
      </CardTitle>
      {onGetAiSuggestion && (
        <Button type="button" variant="outline" size="sm" onClick={onGetAiSuggestion}>
          <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
          AI Suggestion
        </Button>
      )}
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Based on root cause analysis</span>
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

interface PrimaryCauseCardProps {
  primaryCause: string;
  originalPrimaryCause: string;
  immediateCause: string;
  originalImmediateCause: string;
  onPrimaryChange: (val: string) => void;
  onImmediateChange: (val: string) => void;
  /** KB sources that specifically back the primary root cause field. */
  primarySources?: string[];
  /** KB sources that specifically back the immediate cause field. */
  immediateSources?: string[];
}

export const PrimaryRootCauseCard: React.FC<PrimaryCauseCardProps> = ({
  primaryCause, originalPrimaryCause, immediateCause, originalImmediateCause,
  onPrimaryChange, onImmediateChange, primarySources, immediateSources
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        Primary Root Cause <Sparkles className="h-5 w-5 text-blue-600" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Underlying Root Cause</Label>
          <ModifiedStatus original={originalPrimaryCause} current={primaryCause} />
        </div>
        <Textarea
          rows={3}
          value={primaryCause}
          onChange={(e) => onPrimaryChange(e.target.value)}
        />
        {primarySources && primarySources.length > 0 && (
          <SourcesUsed sources={primarySources} />
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Immediate Cause (direct trigger)</Label>
          <ModifiedStatus original={originalImmediateCause} current={immediateCause} />
        </div>
        <Textarea
          rows={2}
          value={immediateCause}
          onChange={(e) => onImmediateChange(e.target.value)}
        />
        {immediateSources && immediateSources.length > 0 && (
          <SourcesUsed sources={immediateSources} />
        )}
      </div>
    </CardContent>
  </Card>
);

interface ListTextareaCardProps {
  title: string;
  label: string;
  value: string;
  originalValue: string;
  onChange: (val: string) => void;
  sources?: string[];
}

export const ListTextareaCard: React.FC<ListTextareaCardProps> = ({
  title, label, value, originalValue, onChange, sources
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {title} <Sparkles className="h-5 w-5 text-blue-600" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {label && <Label>{label}</Label>}
          <ModifiedStatus original={originalValue} current={value} />
        </div>
        <Textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {sources && sources.length > 0 && (
          <div className="pt-1">
            <SourcesUsed sources={sources} />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);