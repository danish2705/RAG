import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertTriangle, User, Sparkles, Loader2 } from "lucide-react";
import type { DataField } from "../../types/dataProvenance";
import { getClassificationBadgeClass } from "../../utils/deviation/classification";
import { getSeverityBadgeClass } from "../../utils/deviation/impactAssessment";

export const NoSummaryDataGuard: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => (
  <div className="p-6 w-full">
    <Card>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
        <p className="text-foreground font-medium">No summary data found.</p>
        <p className="text-sm text-muted-foreground mt-1">Please go back and complete the CAPA step first.</p>
        <Button className="mt-4" onClick={onGoBack}>Go Back</Button>
      </CardContent>
    </Card>
  </div>
);

export const ConfidenceBar: React.FC<{ score: number }> = ({ score }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-muted-foreground">AI Confidence Score</span>
      <span className="text-sm font-semibold text-foreground">{score}%</span>
    </div>
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className={`h-2 rounded-full ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

export function SummaryModifiedBadge<T>({ field }: { field?: DataField<T> }) {
  if (!field || field.source !== "modified") return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 select-none w-fit">
      <Sparkles className="h-3 w-3" /> Modified
    </span>
  );
}

export const SavedByDialog: React.FC<any> = ({
  open, onOpenChange, savedByName, setSavedByName, savedByError, setSavedByError, onConfirm
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /> Save Record</DialogTitle>
      </DialogHeader>
      <div className="py-4 space-y-3">
        <p className="text-sm text-muted-foreground">Please enter your name to record who is saving this deviation case.</p>
        <div className="space-y-1.5">
          <Label>Saved By</Label>
          <Input
            placeholder="Enter your full name"
            value={savedByName}
            onChange={(e) => { setSavedByName(e.target.value); if (savedByError) setSavedByError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") onConfirm(); }}
            autoFocus
          />
          {savedByError && <p className="text-xs text-red-600">{savedByError}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onConfirm}>Confirm & Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const SummaryImpactCard: React.FC<{ entry: any; provenance: any }> = ({ entry, provenance }) => {
  const impProv = provenance?.impactAssessment?.impact_assessment;
  const keyProv = impProv?.[entry.key as keyof typeof impProv];
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          {entry.category}
          {(keyProv?.severity?.source === "modified" || keyProv?.rationale?.source === "modified") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 select-none">
              <Sparkles className="h-3 w-3" /> Modified
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeClass(entry.severity)}`}>
            {entry.severity}
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
      </CardContent>
    </Card>
  );
};

export const SummaryClassificationCard: React.FC<{ parsed: any; provenance: any }> = ({ parsed, provenance }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-600" /> Classification</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Classification:</span>
        <Badge className={getClassificationBadgeClass(parsed.classification)}>{parsed.classification}</Badge>
        <SummaryModifiedBadge field={provenance?.classification?.classification} />
      </div>
      <ConfidenceBar score={parsed.confidence_score} />
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <p className="text-sm font-medium text-foreground">AI Rationale</p>
          <SummaryModifiedBadge field={provenance?.classification?.rationale} />
        </div>
        <ul className="space-y-2">
          {parsed.rationale.map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {p}</li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

export const SummaryRcaSection: React.FC<{ parsed: any; provenance: any }> = ({ parsed, provenance }) => (
  <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Primary Root Cause <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">Underlying Root Cause</p>
            <SummaryModifiedBadge field={provenance?.rca?.primary_root_cause} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">{parsed.primary_root_cause}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">Immediate Cause (direct trigger)</p>
            <SummaryModifiedBadge field={provenance?.rca?.immediate_cause} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">{parsed.immediate_cause}</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Contributing Factors <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SummaryModifiedBadge field={provenance?.rca?.contributing_factors} />
        <ul className="space-y-2">
          {parsed.contributing_factors.map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {p}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Supporting Evidence <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SummaryModifiedBadge field={provenance?.rca?.evidence} />
        <ul className="space-y-2">
          {parsed.evidence.map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {p}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  </>
);

export const SummaryCapaSection: React.FC<{ parsed: any; provenance: any; correction?: string }> = ({ parsed, provenance, correction }) => (
  <>
    {correction && (
      <Card>
        <CardHeader><CardTitle>Correction</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">{correction}</p></CardContent>
      </Card>
    )}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Corrective Action <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SummaryModifiedBadge field={provenance?.capa?.corrective_actions} />
        <ul className="space-y-2">
          {parsed.corrective_actions.map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {p}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Preventive Action <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SummaryModifiedBadge field={provenance?.capa?.preventive_actions} />
        <ul className="space-y-2">
          {parsed.preventive_actions.map((p: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" /> {p}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Effectiveness Check & Due Date <Sparkles className="h-5 w-5 text-blue-600" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">Effectiveness Check</p>
            <SummaryModifiedBadge field={provenance?.capa?.effectiveness_check} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">{parsed.effectiveness_check}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">Due Date</p>
            <SummaryModifiedBadge field={provenance?.capa?.due_date} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-md p-3">{parsed.due_date}</p>
        </div>
      </CardContent>
    </Card>
  </>
);

export const SummarySaveSection: React.FC<{ saveError: string | null; isSaving: boolean; isSaved: boolean; onSave: () => void }> = ({ saveError, isSaving, isSaved, onSave }) => (
  <div className="pt-1 pb-1">
    {saveError && (
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Save failed</p>
          <p className="mt-1">{saveError}</p>
        </div>
      </div>
    )}
    <div className="flex justify-end pr-10">
      <Button onClick={onSave} disabled={isSaving || isSaved} className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
        {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save"}
      </Button>
    </div>
  </div>
);