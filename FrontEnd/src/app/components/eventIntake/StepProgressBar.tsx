import { Check } from "lucide-react";
import { useLocation } from "react-router";

type Classification = "Deviation" | "Change Control" | "Hybrid";

interface StepProgressBarProps {
  classification?: Classification;
  capaAccepted?: boolean;
  implementationAccepted?: boolean;
  changeControlStepAccepted?: boolean;
}

// Intake ("/deviation") and Classification ("/deviation/ai-recommendation")
// are shared by both flows — only the routes after classification diverge.
const DEVIATION_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/deviation/impact-assessment": 2,
  "/deviation/root-cause": 3,
  "/deviation/capa": 4,
  "/deviation/summary": 4,
};

// NOTE: keys must match routes.tsx exactly.
// routes.tsx defines "change-control/change-impact-assessment", not
// "change-control/impact-assessment" — that mismatch was making this
// map miss on that page and silently fall back to step 0.
const CHANGE_CONTROL_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/change-control/change-impact-assessment": 2,
  "/change-control/risk-criticality": 3,
  "/change-control/validation-testing": 4,
  "/change-control/implementation": 5,
  "/change-control/summary": 5,
};

const CAPA_STEP_INDEX = 4;
const CC_IMPLEMENTATION_STEP_INDEX = 5;

function getDeviationSteps(classification?: Classification) {
  const step2 = classification ?? "Classification";
  return [
    { label: "Intake" },
    { label: step2 },
    { label: "Severity" },
    { label: "RCA" },
    { label: "CAPA" },
  ];
}

function getChangeControlSteps(classification?: Classification) {
  const step1 = classification ?? "Classification";
  return [
    { label: "Intake" },
    { label: step1 },
    { label: "Impact" },
    { label: "Risk" },
    { label: "Validation" },
    { label: "Implementation" },
  ];
}

export function StepProgressBar({
  classification,
  capaAccepted,
  implementationAccepted,
  changeControlStepAccepted,
}: StepProgressBarProps) {
  const { pathname } = useLocation();

  const deviationBar = (
    <DeviationBar
      pathname={pathname}
      classification={classification}
      capaAccepted={capaAccepted}
      implementationAccepted={implementationAccepted}
    />
  );

  const changeControlBar = (
    <ChangeControlBar
      pathname={pathname}
      classification={classification}
      implementationAccepted={implementationAccepted}
      changeControlStepAccepted={changeControlStepAccepted}
    />
  );

  // Explicit classification takes priority
  if (classification === "Deviation") {
    return <div className="mb-6">{deviationBar}</div>;
  }

  if (classification === "Change Control") {
    return <div className="mb-6">{changeControlBar}</div>;
  }

  // If classification isn't available, infer from route
  if (pathname.startsWith("/change-control")) {
    return <div className="mb-6">{changeControlBar}</div>;
  }

  if (
    pathname.startsWith("/deviation") &&
    pathname !== "/deviation" &&
    pathname !== "/deviation/ai-recommendation"
  ) {
    return <div className="mb-6">{deviationBar}</div>;
  }

  // Only show both bars on shared pages
  return (
    <div className="space-y-3 mb-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Deviation Path
        </p>
        {deviationBar}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Change Control Path
        </p>
        {changeControlBar}
      </div>
    </div>
  );
}

function DeviationBar({
  pathname,
  classification,
  capaAccepted,
  implementationAccepted,
}: {
  pathname: string;
  classification?: Classification;
  capaAccepted?: boolean;
  implementationAccepted?: boolean;
}) {
  const currentStep = DEVIATION_STEP_ROUTES[pathname] ?? 0;
  const isOnSummary = pathname === "/deviation/summary";
  const steps = getDeviationSteps(classification);

  return (
    <ProgressBarShell
      steps={steps}
      currentStep={currentStep}
      isStepCompleted={(index) =>
        index < currentStep ||
        (index === CAPA_STEP_INDEX &&
          (capaAccepted || implementationAccepted || isOnSummary))
      }
    />
  );
}

function ChangeControlBar({
  pathname,
  classification,
  implementationAccepted,
  changeControlStepAccepted,
}: {
  pathname: string;
  classification?: Classification;
  implementationAccepted?: boolean;
  changeControlStepAccepted?: boolean;
}) {
  const currentStep = CHANGE_CONTROL_STEP_ROUTES[pathname] ?? 0;
  const isOnSummary = pathname === "/change-control/summary";
  const steps = getChangeControlSteps(classification);

  return (
    <ProgressBarShell
      steps={steps}
      currentStep={currentStep}
      isStepCompleted={(index) =>
        index < currentStep ||
        (index === CC_IMPLEMENTATION_STEP_INDEX &&
          (implementationAccepted || isOnSummary)) ||
        (index === currentStep &&
          (changeControlStepAccepted || isOnSummary))
      }
    />
  );
}

function ProgressBarShell({
  steps,
  currentStep,
  isStepCompleted,
}: {
  steps: { label: string }[];
  currentStep: number;
  isStepCompleted: (index: number) => boolean;
}) {
  return (
    <div
      className="bg-card border border-border rounded-xl px-6 py-4 w-full"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isActive = index === currentStep && !isCompleted;

          return (
            <div
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`
                    flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-muted-foreground border border-border"
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
                      ? "text-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-all ${
                    index < currentStep ? "bg-green-400" : "bg-muted"
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