import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

export type Classification = "Deviation" | "Change Control" | "Hybrid";

interface StepProgressBarProps {
  classification?: Classification;
  capaAccepted?: boolean;
  implementationAccepted?: boolean;
  changeControlStepAccepted?: boolean;
}

// Intake ("/deviation") and Classification ("/deviation/ai-recommendation")
// are shared by both flows — only the routes after classification diverge.[cite: 6]
const DEVIATION_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/deviation/impact-assessment": 2,
  "/deviation/root-cause": 3,
  "/deviation/capa": 4,
  "/deviation/summary": 5,
};

// NOTE: keys must match routes.tsx exactly.[cite: 6]
// routes.tsx defines "change-control/change-impact-assessment", not
// "change-control/impact-assessment" — that mismatch was making this
// map miss on that page and silently fall back to step 0.[cite: 6]
const CHANGE_CONTROL_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/change-control/change-impact-assessment": 2,
  "/change-control/risk-criticality": 3,
  "/change-control/validation-testing": 4,
  "/change-control/implementation": 5,
  "/change-control/summary": 6,
};

const CAPA_STEP_INDEX = 4;
const CC_IMPLEMENTATION_STEP_INDEX = 5;

function getDeviationSteps(classification?: Classification) {
  const step2 = classification ?? "Classification";
  return [
    { label: "Intake", path: "/deviation" },
    { label: step2, path: "/deviation/ai-recommendation" },
    { label: "Severity", path: "/deviation/impact-assessment" },
    { label: "RCA", path: "/deviation/root-cause" },
    { label: "CAPA", path: "/deviation/capa" },
    { label: "Summary", path: "/deviation/summary" },
  ];
}

function getChangeControlSteps(classification?: Classification) {
  const step1 = classification ?? "Classification";
  return [
    { label: "Intake", path: "/deviation" },
    { label: step1, path: "/deviation/ai-recommendation" },
    { label: "Impact", path: "/change-control/change-impact-assessment" },
    { label: "Risk", path: "/change-control/risk-criticality" },
    { label: "Validation", path: "/change-control/validation-testing" },
    { label: "Implementation", path: "/change-control/implementation" },
    { label: "Summary", path: "/change-control/summary" },
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

  // Explicit classification takes priority[cite: 6]
  if (classification === "Deviation") {
    return <div className="mb-6">{deviationBar}</div>;
  }

  if (classification === "Change Control") {
    return <div className="mb-6">{changeControlBar}</div>;
  }

  // If classification isn't available, infer from route[cite: 6]
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

  // Only show both bars on shared pages[cite: 6]
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
  const steps = getDeviationSteps(classification);

  // Remember the highest step reached in this session so navigating back keeps progress green
  const [maxReached, setMaxReached] = useState<number>(() => {
    const saved = sessionStorage.getItem("qms_deviation_max_step");
    return saved ? Math.max(parseInt(saved, 10), currentStep) : currentStep;
  });

  useEffect(() => {
    if (currentStep > maxReached) {
      setMaxReached(currentStep);
      sessionStorage.setItem("qms_deviation_max_step", currentStep.toString());
    }
  }, [currentStep, maxReached]);

  // If user starts over at step 0 (Intake), reset the memory
  useEffect(() => {
    if (pathname === "/deviation" && !sessionStorage.getItem("qms_active_case")) {
      setMaxReached(0);
      sessionStorage.removeItem("qms_deviation_max_step");
    }
  }, [pathname]);

  return (
    <ProgressBarShell
      steps={steps}
      currentStep={currentStep}
      maxReachedStep={maxReached}
      isStepCompleted={(index) =>
        index < maxReached ||
        (index === CAPA_STEP_INDEX && (capaAccepted || implementationAccepted || maxReached > CAPA_STEP_INDEX))
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
  const steps = getChangeControlSteps(classification);

  // Remember the highest step reached in this session so navigating back keeps progress green
  const [maxReached, setMaxReached] = useState<number>(() => {
    const saved = sessionStorage.getItem("qms_cc_max_step");
    return saved ? Math.max(parseInt(saved, 10), currentStep) : currentStep;
  });

  useEffect(() => {
    if (currentStep > maxReached) {
      setMaxReached(currentStep);
      sessionStorage.setItem("qms_cc_max_step", currentStep.toString());
    }
  }, [currentStep, maxReached]);

  useEffect(() => {
    if (pathname === "/deviation" && !sessionStorage.getItem("qms_active_case")) {
      setMaxReached(0);
      sessionStorage.removeItem("qms_cc_max_step");
    }
  }, [pathname]);

  return (
    <ProgressBarShell
      steps={steps}
      currentStep={currentStep}
      maxReachedStep={maxReached}
      isStepCompleted={(index) =>
        index < maxReached ||
        (index === CC_IMPLEMENTATION_STEP_INDEX && (implementationAccepted || maxReached > CC_IMPLEMENTATION_STEP_INDEX)) ||
        (index === currentStep && changeControlStepAccepted)
      }
    />
  );
}

function ProgressBarShell({
  steps,
  currentStep,
  maxReachedStep,
  isStepCompleted,
}: {
  steps: { label: string; path: string }[];
  currentStep: number;
  maxReachedStep: number;
  isStepCompleted: (index: number) => boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleStepClick = (path: string) => {
    navigate(path, { state: location.state });
  };

  return (
    <div
      className="bg-card border border-border rounded-xl px-6 py-4 w-full shadow-sm"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          // A step is considered completed if it was already passed in our max reached history
          const isCompleted = isStepCompleted(index) && index !== currentStep;
          // The active step is the exact page we are currently viewing
          const isActive = index === currentStep;

          return (
            <div
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <button
                type="button"
                onClick={() => handleStepClick(step.path)}
                className="flex items-center gap-2 shrink-0 group cursor-pointer focus:outline-none rounded-lg px-2 py-1 -mx-2 transition-all duration-200 hover:bg-muted/60 active:scale-95"
                title={`Click to jump to ${step.label}`}
              >
                <div
                  className={`
                    flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 group-hover:scale-110 group-hover:shadow-md shrink-0
                    ${
                      isActive
                        ? "bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background group-hover:bg-blue-700 font-bold"
                        : isCompleted || index <= maxReachedStep
                          ? "bg-green-500 text-white group-hover:bg-green-600"
                          : "bg-muted text-muted-foreground border border-border group-hover:border-blue-500/50 group-hover:text-foreground"
                    }
                  `}
                >
                  {/* Show checkmark for all completed steps unless we are actively viewing/editing it right now */}
                  {(isCompleted || (index < maxReachedStep && !isActive)) ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={`text-sm font-medium whitespace-nowrap transition-all duration-200 group-hover:underline group-hover:underline-offset-4 ${
                    isActive
                      ? "text-foreground font-bold"
                      : isCompleted || index <= maxReachedStep
                        ? "text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        : "text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-all duration-300 ${
                    index < maxReachedStep ? "bg-green-400" : "bg-muted"
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