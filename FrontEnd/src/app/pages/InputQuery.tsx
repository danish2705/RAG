import { Button } from "../components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { AIAssistant } from "../components/chat/AiAssistant";
import { LlmFailureDialog } from "../components/LlmFailureDialog";
import { useInputQueryForm } from "../hooks/useInputQueryForm";
import {
  SubmitErrorBanner,
  BasicInformationCard,
  DescriptionCard,
  ImmediateActionsCard,
  AttachmentsCard,
} from "../components/InputQueryCards";

export function NewDeviation() {
  const {
    navigate,
    fileInputRef,
    chatOpen,
    setChatOpen,
    formData,
    errors,
    attachments,
    rejectedFiles,
    isSubmitting,
    submitError,
    isFormReady,
    updateField,
    handleFileUpload,
    handleDrop,
    handleDragOver,
    removeFile,
    handleSubmit,
    llmFailure,
  } = useInputQueryForm();

  return (
    <div className="relative h-full w-full">
      <LlmFailureDialog control={llmFailure} />

      <div
        className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? "mr-80" : ""}`}
      >
        {submitError && <SubmitErrorBanner message={submitError} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            <BasicInformationCard
              formData={formData}
              errors={errors}
              updateField={updateField}
            />

            <DescriptionCard
              formData={formData}
              errors={errors}
              updateField={updateField}
            />

            <ImmediateActionsCard
              value={formData.immediateActions}
              onChange={(value) => updateField("immediateActions", value)}
            />

            <AttachmentsCard
              fileInputRef={fileInputRef}
              attachments={attachments}
              rejectedFiles={rejectedFiles}
              onFileUpload={handleFileUpload}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onRemove={removeFile}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !isFormReady}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
