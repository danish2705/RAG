import { StepProgressBar } from "../components/eventIntake";
import { useWorkflowStore } from "../store/workflowStore";

export function ChangecontrolSummary() {
  const result = useWorkflowStore((s) => s.pipelineResult);

  return (
    <div className="min-h-screen p-6">
      <StepProgressBar
        classification={result?.stages?.classification?.parsed?.classification}
        changeControlStepAccepted
      />

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Summary
        </h1>
      </div>
    </div>
  );
}