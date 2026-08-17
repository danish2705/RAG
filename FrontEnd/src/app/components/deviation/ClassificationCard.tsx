import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Sparkles, Info } from "lucide-react";
import { ModifiedStatus } from "../eventIntake";
import { flattenSources } from "../shared/SourcesUsed";
import type { ClassificationType } from "../../types/pipeline";

interface ClassificationCardProps {
  editedClassification: ClassificationType | "";
  setEditedClassification: (v: ClassificationType) => void;
  confidenceScore: number;
  editedRationale: string;
  setEditedRationale: (v: string) => void;
  originalClassification: ClassificationType;
  originalRationale: string[];
  onGetAiSuggestion?: () => void;
  /** KB source document names per rationale bullet, same order/length as originalRationale. */
  rationaleSources?: string[][];
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  editedClassification,
  setEditedClassification,
  confidenceScore,
  editedRationale,
  setEditedRationale,
  originalClassification,
  originalRationale,
  onGetAiSuggestion,
  rationaleSources,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI Classification
        </CardTitle>
        {onGetAiSuggestion && (
          <Button type="button" variant="outline" size="sm" onClick={onGetAiSuggestion}>
            <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
            AI Suggestion
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
  {/* Classification Type Section */}
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm font-medium text-muted-foreground">
      Classification:
    </span>
    <Select
      value={editedClassification || undefined}
      onValueChange={(v) =>
        setEditedClassification(v as ClassificationType)
      }
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select classification..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Deviation">Deviation</SelectItem>
        <SelectItem value="Change Control">Change Control</SelectItem>
      </SelectContent>
    </Select>
    <ModifiedStatus
      original={originalClassification}
      current={editedClassification}
    />
  </div>

  {/* ...rest of the component stays exactly the same */}

        {/* Confidence Score Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                AI Confidence Score
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Confidence is calculated based on predefined business
                      rules and data completeness. Scores below 70 are routed
                      for human review.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {confidenceScore}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                confidenceScore >= 80
                  ? "bg-green-500"
                  : confidenceScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>

        {/* AI Rationale Section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-medium text-foreground">AI Rationale</p>
            <ModifiedStatus
              original={originalRationale.join("\n").trim()}
              current={editedRationale.trim()}
            />
          </div>
          <div className="space-y-1">
            <Textarea
              rows={5}
              value={editedRationale}
              onChange={(e) => setEditedRationale(e.target.value)}
              placeholder="One rationale point per line..."
            />
            {(() => {
              const sources = flattenSources(rationaleSources);
              return sources.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sources used: </span>
                  {sources.join(", ")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  One point per line
                </p>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};