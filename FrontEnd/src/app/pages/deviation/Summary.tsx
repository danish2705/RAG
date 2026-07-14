import { StepProgressBar } from "../../components/eventIntake/StepProgressBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { AIAssistant } from "../../components/chat/AiAssistant";
import { useSummaryReview } from "../../hooks/deviation/useSummaryReview";
import {
  NoSummaryDataGuard,
  ConfidenceBar,
  SavedByDialog,
  SummaryImpactCard,
  SummaryClassificationCard,
  SummaryRcaSection,
  SummaryCapaSection,
  SummarySaveSection,
}  from "../../components/deviation/summaryCards";

export function Summary() {
  const {
    result,
    classificationParsed,
    impactParsed,
    rcaParsed,
    capaParsed,
    provenance,
    chatOpen,
    setChatOpen,
    isSaving,
    isSaved,
    saveError,
    showSavedByDialog,
    setShowSavedByDialog,
    savedByName,
    setSavedByName,
    savedByError,
    setSavedByError,
    impactEntries,
    handleSaveClick,
    handleConfirmSave,
    navigate,
  } = useSummaryReview();

  if (
    !result ||
    !classificationParsed ||
    !impactParsed ||
    !rcaParsed ||
    !capaParsed
  ) {
    return <NoSummaryDataGuard onGoBack={() => navigate("/deviation")} />;
  }

  return (
    <div className="relative h-full w-full">
      <div
        className={`min-h-screen p-6 transition-[padding] duration-200 ${chatOpen ? "pr-80" : "pr-6"}`}
      >
        <StepProgressBar
          classification={classificationParsed.classification}
          capaAccepted={true}
        />

        <SavedByDialog
          open={showSavedByDialog}
          onOpenChange={setShowSavedByDialog}
          savedByName={savedByName}
          setSavedByName={setSavedByName}
          savedByError={savedByError}
          setSavedByError={setSavedByError}
          onConfirm={handleConfirmSave}
        />

        <div className="mb-6 flex items-center gap-3">
          {isSaved && (
            <Badge className="ml-auto bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Saved — redirecting…
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          <SummaryClassificationCard
            parsed={classificationParsed}
            provenance={provenance}
          />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" /> Impact Assessment
                — Overall Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={impactParsed.confidence_score} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {impactEntries.map((entry) => (
              <SummaryImpactCard
                key={entry.key}
                entry={entry}
                provenance={provenance}
              />
            ))}
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" /> Root Cause
                Analysis — Overall Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={rcaParsed.confidence_score} />
            </CardContent>
          </Card>

          <SummaryRcaSection parsed={rcaParsed} provenance={provenance} />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" /> CAPA — Overall
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConfidenceBar score={capaParsed.confidence_score} />
            </CardContent>
          </Card>

          <SummaryCapaSection
            parsed={capaParsed}
            provenance={provenance}
            correction={result.correction}
          />

          <SummarySaveSection
            saveError={saveError}
            isSaving={isSaving}
            isSaved={isSaved}
            onSave={handleSaveClick}
          />
        </div>

        <div className="fixed top-16 right-0 bottom-0 z-40">
          <AIAssistant
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
          />
        </div>
      </div>
    </div>
  );
}
