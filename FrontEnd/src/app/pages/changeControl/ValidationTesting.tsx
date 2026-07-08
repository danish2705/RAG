import { useState } from "react";
import { StepProgressBar } from "../../components/eventIntake";
import { useWorkflowStore } from "../../store/workflowStore";

export function ValidationTesting() {
  const result = useWorkflowStore((s) => s.pipelineResult);

  const [validationLevel, setValidationLevel] = useState<"none" | "partial" | "full">("none");
  const [scenarioTesting, setScenarioTesting] = useState("");
  const [regressionScope, setRegressionScope] = useState("");
  const [uatRequirements, setUatRequirements] = useState("");
  const [traceability, setTraceability] = useState("");

  return (
    <div className="min-h-screen w-full p-6">
      <StepProgressBar
        classification={result?.stages?.classification?.parsed?.classification}
      />

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Validation Testing Strategy
        </h1>
      </div>

      {/* Full-page container */}
      <div className="mt-6 w-full min-h-[calc(100vh-160px)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Required Validation Level */}
          <div>
            <label
              htmlFor="validationLevel"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Required Validation Level
            </label>
            <select
              id="validationLevel"
              value={validationLevel}
              onChange={(e) =>
                setValidationLevel(e.target.value as "none" | "partial" | "full")
              }
              className="w-full md:w-1/3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </div>

          {/* Scenario Based Testing Recommendations */}
          <div>
            <label
              htmlFor="scenarioTesting"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Scenario Based Testing Recommendations
            </label>
            <textarea
              id="scenarioTesting"
              value={scenarioTesting}
              onChange={(e) => setScenarioTesting(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe recommended test scenarios..."
            />
          </div>

          {/* Regression Scope */}
          <div>
            <label
              htmlFor="regressionScope"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Regression Scope
            </label>
            <textarea
              id="regressionScope"
              value={regressionScope}
              onChange={(e) => setRegressionScope(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the regression testing scope..."
            />
          </div>

          {/* UAT Requirements */}
          <div>
            <label
              htmlFor="uatRequirements"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              UAT Requirements
            </label>
            <textarea
              id="uatRequirements"
              value={uatRequirements}
              onChange={(e) => setUatRequirements(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe UAT requirements..."
            />
          </div>

          {/* Traceability to Requirements or Procedure */}
          <div>
            <label
              htmlFor="traceability"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Traceability to Requirements or Procedure
            </label>
            <textarea
              id="traceability"
              value={traceability}
              onChange={(e) => setTraceability(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link to relevant requirements or procedures..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}