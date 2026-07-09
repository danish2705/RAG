import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
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
import { Sparkles, Info } from "lucide-react";
import { ModifiedStatus } from "../eventIntake";
import { getClassificationBadgeClass } from "../../utils/deviation/classification";
import type { ClassificationType } from "../../types/pipeline";

interface ClassificationCardProps {
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  currentClassification: ClassificationType;
  editedClassification: ClassificationType;
  setEditedClassification: (v: ClassificationType) => void;
  confidenceScore: number;
  originalRationale: string[];
  editedRationale: string;
  setEditedRationale: (v: string) => void;
  rationaleLines: string[];
  originalClassification: ClassificationType;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  isOverrideEditing,
  overrideConfirmed,
  currentClassification,
  editedClassification,
  setEditedClassification,
  confidenceScore,
  originalRationale,
  editedRationale,
  setEditedRationale,
  rationaleLines,
  originalClassification,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          AI Classification
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Classification Type Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">
            Classification:
          </span>
          {isOverrideEditing ? (
            <Select
              value={editedClassification}
              onValueChange={(v) =>
                setEditedClassification(v as ClassificationType)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deviation">Deviation</SelectItem>
                <SelectItem value="Change Control">Change Control</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <>
              <Badge
                className={getClassificationBadgeClass(currentClassification)}
              >
                {currentClassification}
              </Badge>
              <ModifiedStatus
                enabled={overrideConfirmed && !isOverrideEditing}
                original={originalClassification}
                current={editedClassification}
              />
            </>
          )}
        </div>

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
            {!isOverrideEditing && (
              <ModifiedStatus
                enabled={overrideConfirmed}
                original={originalRationale.join("\n").trim()}
                current={editedRationale.trim()}
              />
            )}
          </div>
          {isOverrideEditing ? (
            <div className="space-y-1">
              <Textarea
                rows={5}
                value={editedRationale}
                onChange={(e) => setEditedRationale(e.target.value)}
                placeholder="One rationale point per line..."
              />
              <p className="text-xs text-muted-foreground">
                One point per line
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {rationaleLines.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};