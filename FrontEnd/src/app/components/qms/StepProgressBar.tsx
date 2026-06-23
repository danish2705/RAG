import { Check } from "lucide-react";
import { useLocation } from "react-router";

type Classification = "Deviation" | "Change Control" | "Hybrid";

interface StepProgressBarProps {
  classification?: Classification;
  capaAccepted?: boolean;
}

// Step 2 label is dynamic based on classification
function getSteps(classification?: Classification) {
  const step2 = classification ?? "Classification";
  return [
    { label: "Intake" },
    { label: step2 },
    { label: "Severity" },
    { label: "RCA" },
    { label: "CAPA" },
  ];
}

// Maps each route to its step index (0-based)
const STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/deviation/immediate-correction": 2,
  "/deviation/impact-assessment": 2,
  "/deviation/historical-analysis": 2,
  "/deviation/root-cause": 3,
  "/deviation/capa": 4,
  "/deviation/summary": 4,
};

// The CAPA step index (0-based)
const CAPA_STEP_INDEX = 4;

export function StepProgressBar({
  classification,
  capaAccepted,
}: StepProgressBarProps) {
  const { pathname } = useLocation();
  const currentStep = STEP_ROUTES[pathname] ?? 0;
  const steps = getSteps(classification);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-6 w-full"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          // A step is completed if it's before the current step,
          // OR if it's the CAPA step and the user has accepted CAPA.
          const isCompleted =
            index < currentStep || (capaAccepted && index === CAPA_STEP_INDEX);
          const isActive = index === currentStep && !isCompleted;

          return (
            <div
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              {/* Step circle + label */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`
                    flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? "text-gray-900"
                      : isCompleted
                        ? "text-gray-500"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-all ${
                    index < currentStep ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
