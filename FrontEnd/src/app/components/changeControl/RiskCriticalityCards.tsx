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

// Styling aligned with the sibling ChangeImpactAssessment.tsx badges
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

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function filingsToText(filings: string[]): string {
  return filings.join("\n");
}

export const NoRiskCriticalityDataGuard: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">
          No risk &amp; criticality evaluation data found.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please go back and complete the Change Impact Assessment first.
        </p>
        <Button className="mt-4" onClick={onGoBack}>
          Go Back
        </Button>
      </CardContent>
    </Card>
  </div>
);

export const RiskConfidenceCard = React.memo<{
  score: number;
  impactRiskLevel: string;
}>(({ score, impactRiskLevel }) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Overall AI Confidence Score
      </CardTitle>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Based on Change Impact Assessment (risk scoring: {impactRiskLevel})
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
));
RiskConfidenceCard.displayName = "RiskConfidenceCard";

// Shared layout for the four Level + Rationale risk category cards
// NOTE on memo effectiveness here: for the two cards that pass
// extraEditor/extraReadOnly (Regulatory Impact), the parent page currently
// creates that JSX inline on every render (`extraEditor={<RegulatoryFilingsEditor .../>}`),
// which is a brand-new element reference each time — so memo still won't
// skip a re-render for that specific card. It works fully for the other
// three (PS, Data Integrity, Operational Disruption) since all their props
// are now primitives or useCallback-stabilized functions. Fixing the
// Regulatory card fully would mean wrapping that inline JSX in useMemo at
// the call site in RiskCriticality.tsx, or moving the filings UI inside
// this component behind a `variant` prop instead of a ReactNode prop.
export const RiskLevelCard = React.memo<{
  title: string;
  level: string;
  rationale: string;
  isOverrideEditing: boolean;
  isModified: boolean;
  changedWithoutRationale: boolean;
  onLevelChange: (value: string) => void;
  onRationaleChange: (value: string) => void;
  /** Optional extra editable list rendered between the Select and rationale (Regulatory Impact filings) */
  extraEditor?: React.ReactNode;
  /** Optional extra read-only content rendered between the badge and rationale */
  extraReadOnly?: React.ReactNode;
  badgeSuffix?: string;
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
    extraEditor,
    extraReadOnly,
    badgeSuffix,
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
            {extraEditor}
            {changedWithoutRationale && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Update rationale below
              </p>
            )}
            <Textarea
              rows={extraEditor ? 3 : 4}
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
                {badgeSuffix ? ` ${badgeSuffix}` : ""}
              </span>
            </div>
            {extraReadOnly}
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
              {rationale || "No rationale provided."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
);
RiskLevelCard.displayName = "RiskLevelCard";

// Regulatory Impact's extra "filings/submissions affected" list — edit mode
export const RegulatoryFilingsEditor = React.memo<{
  filings: string[];
  onChange: (filings: string[]) => void;
}>(({ filings, onChange }) => (
  <Textarea
    rows={2}
    value={filingsToText(filings)}
    onChange={(e) => onChange(parseLines(e.target.value))}
    placeholder="One filing/submission per line..."
    className="resize-none text-sm"
  />
));
RegulatoryFilingsEditor.displayName = "RegulatoryFilingsEditor";

// Regulatory Impact's extra "filings/submissions affected" list — read mode
export const RegulatoryFilingsList = React.memo<{ filings: string[] }>(
  ({ filings }) => (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
        Filings / Submissions Affected
      </p>
      {filings.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {filings.map((f, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-[13px] text-gray-500 dark:text-gray-400"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-600 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 italic">
          No specific filings or submissions identified.
        </p>
      )}
    </div>
  ),
);
RegulatoryFilingsList.displayName = "RegulatoryFilingsList";

export const RiskRankingCard = React.memo<{
  rankingJustification: string;
  isOverrideEditing: boolean;
  isModified: boolean;
  onChange: (value: string) => void;
}>(({ rankingJustification, isOverrideEditing, isModified, onChange }) => (
  <Card className="shadow-sm dark:shadow-none border-gray-100 dark:border-white/10 bg-white dark:bg-black flex flex-col h-full md:col-span-2">
    <CardContent className="pt-6 flex flex-col flex-1">
      <div className="flex items-center gap-2 justify-between mb-4">
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100">
          Risk Ranking &amp; Justification
        </h3>
        {!isOverrideEditing && isModified && <ModifiedBadge />}
      </div>

      {isOverrideEditing ? (
        <Textarea
          rows={4}
          value={rankingJustification}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Explain the overall risk ranking for this change..."
          className="resize-none text-sm md:w-2/3"
        />
      ) : (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {rankingJustification || "No justification provided."}
        </p>
      )}
    </CardContent>
  </Card>
));
RiskRankingCard.displayName = "RiskRankingCard";
