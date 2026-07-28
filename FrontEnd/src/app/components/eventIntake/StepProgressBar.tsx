import React, { useState, useEffect } from "react";
import { Check, Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

export type Classification = "Deviation" | "Change Control" | "Hybrid";

interface Step {
  label: string;
  path: string;
}

interface StepProgressBarProps {
  classification?: Classification;

  /**
   * Which Deviation-flow steps actually have real, saved data behind them —
   * in order: [Intake, Classification, Severity, RCA, CAPA, Summary].
   * This is the ONLY thing that decides what's green and what's clickable.
   * A step is "complete" because its data exists, not because the user's
   * browser happened to visit it once. Pass this straight from whatever
   * already knows the answer (your workflow store, e.g.
   * `[Boolean(w.classification), Boolean(w.impactAssessment), Boolean(w.rca), Boolean(w.capa)]`,
   * with Intake implicitly true whenever a case is open).
   */
  deviationStepsComplete?: boolean[];

  /**
   * Same idea for the Change Control flow, in order:
   * [Intake, Classification, Impact, Risk, Validation, Implementation, Summary]
   */
  changeControlStepsComplete?: boolean[];
}

const DEVIATION_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/deviation/impact-assessment": 2,
  "/deviation/root-cause": 3,
  "/deviation/capa": 4,
  "/deviation/summary": 5,
};

const CHANGE_CONTROL_STEP_ROUTES: Record<string, number> = {
  "/deviation": 0,
  "/deviation/ai-recommendation": 1,
  "/change-control/change-impact-assessment": 2,
  "/change-control/risk-criticality": 3,
  "/change-control/validation-testing": 4,
  "/change-control/implementation": 5,
  "/change-control/summary": 6,
};

function deviationSteps(classification?: Classification): Step[] {
  return [
    { label: "Intake", path: "/deviation" },
    { label: classification ?? "Classification", path: "/deviation/ai-recommendation" },
    { label: "Severity", path: "/deviation/impact-assessment" },
    { label: "RCA", path: "/deviation/root-cause" },
    { label: "CAPA", path: "/deviation/capa" },
    { label: "Summary", path: "/deviation/summary" },
  ];
}

function changeControlSteps(classification?: Classification): Step[] {
  return [
    { label: "Intake", path: "/deviation" },
    { label: classification ?? "Classification", path: "/deviation/ai-recommendation" },
    { label: "Impact", path: "/change-control/change-impact-assessment" },
    { label: "Risk", path: "/change-control/risk-criticality" },
    { label: "Validation", path: "/change-control/validation-testing" },
    { label: "Implementation", path: "/change-control/implementation" },
    { label: "Summary", path: "/change-control/summary" },
  ];
}

/**
 * A step only counts toward the green line if it AND everything before it
 * is actually done. One gap anywhere breaks the chain from that point on —
 * this is what stops a later step from lighting up green just because some
 * unrelated flag happened to be true while the steps in between are empty.
 */
function highestCompletedIndex(completed: boolean[] | undefined): number {
  if (!completed) return -1;
  let i = 0;
  while (i < completed.length && completed[i]) i++;
  return i - 1;
}

export function StepProgressBar({
  classification,
  deviationStepsComplete,
  changeControlStepsComplete,
}: StepProgressBarProps) {
  const { pathname } = useLocation();

  const showChangeControl =
    classification === "Change Control" || pathname.startsWith("/change-control");

  const showDeviationOnly =
    classification === "Deviation" ||
    (pathname.startsWith("/deviation") &&
      pathname !== "/deviation" &&
      pathname !== "/deviation/ai-recommendation");

  if (showChangeControl) {
    return (
      <div className="mb-6">
        <Bar
          steps={changeControlSteps(classification)}
          currentActiveStep={CHANGE_CONTROL_STEP_ROUTES[pathname] ?? 0}
          highestCompletedStep={highestCompletedIndex(changeControlStepsComplete)}
        />
      </div>
    );
  }

  if (showDeviationOnly) {
    return (
      <div className="mb-6">
        <Bar
          steps={deviationSteps(classification)}
          currentActiveStep={DEVIATION_STEP_ROUTES[pathname] ?? 0}
          highestCompletedStep={highestCompletedIndex(deviationStepsComplete)}
        />
      </div>
    );
  }

  // Classification not decided yet (Intake / AI Classification pages) —
  // show both paths so the user can see where either would lead.
  return (
    <div className="space-y-3 mb-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Deviation Path
        </p>
        <Bar
          steps={deviationSteps(classification)}
          currentActiveStep={DEVIATION_STEP_ROUTES[pathname] ?? 0}
          highestCompletedStep={highestCompletedIndex(deviationStepsComplete)}
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Change Control Path
        </p>
        <Bar
          steps={changeControlSteps(classification)}
          currentActiveStep={CHANGE_CONTROL_STEP_ROUTES[pathname] ?? 0}
          highestCompletedStep={highestCompletedIndex(changeControlStepsComplete)}
        />
      </div>
    </div>
  );
}

function Bar({
  steps,
  currentActiveStep,
  highestCompletedStep,
}: {
  steps: Step[];
  currentActiveStep: number;
  highestCompletedStep: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Create a unique storage key per case so step progress doesn't bleed into new cases
  const stateObj = (location.state || {}) as Record<string, unknown>;
  const recordObj = (stateObj.record || {}) as Record<string, unknown>;
  const caseId = String(stateObj.id || recordObj.id || stateObj.uiId || "active_case");
  const storageKey = `workflow_max_step_${caseId}_${steps[0]?.path || "root"}`;

  // Track the furthest step index reached during this session
  const [maxVisited, setMaxVisited] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    // If starting a brand new case on Intake (/deviation) without an existing ID/state, reset frontier
    if (location.pathname === "/deviation" && !location.state) {
      setMaxVisited(0);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      return;
    }

    // Always update maxVisited if we step forward to a higher step index
    const currentMax = Math.max(currentActiveStep, highestCompletedStep + 1, 0);
    if (currentMax > maxVisited) {
      setMaxVisited(currentMax);
      try {
        sessionStorage.setItem(storageKey, currentMax.toString());
      } catch {}
    }
  }, [location.pathname, location.state, currentActiveStep, highestCompletedStep, maxVisited, storageKey]);

  return (
    <div
      className="bg-card border border-border rounded-xl px-6 py-4 w-full shadow-sm"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isActive = index === currentActiveStep;
          const isComplete = index <= highestCompletedStep;
          
          // RULE IMPLEMENTED: The furthest unlocked step is the highest of:
          // 1. Where you stand right now (currentActiveStep)
          // 2. The step right after your last saved data step (highestCompletedStep + 1)
          // 3. The furthest step you previously visited in this workflow (maxVisited)
          // When you jump back from step n to step n-2, maxVisited stays at n, keeping <= n unlocked!
          const maxReachableStep = Math.max(currentActiveStep, highestCompletedStep + 1, maxVisited);
          const isReachable = index <= maxReachableStep;

          return (
            <div key={step.path} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                disabled={!isReachable}
                aria-disabled={!isReachable}
                aria-current={isActive ? "step" : undefined}
                onClick={() => isReachable && navigate(step.path, { state: location.state })}
                title={isReachable ? `Go to ${step.label}` : "This step isn't available yet"}
                className={`flex items-center gap-2 shrink-0 group focus:outline-none rounded-lg px-2 py-1 -mx-2 transition-all duration-200 ${
                  isReachable ? "cursor-pointer hover:bg-muted/60 active:scale-95" : "cursor-not-allowed opacity-50"
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold shrink-0 transition-all duration-200 ${
                    isReachable ? "group-hover:scale-110 group-hover:shadow-md" : ""
                  } ${
                    isComplete
                      ? `bg-green-500 text-white ${isActive ? "ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background" : "group-hover:bg-green-600"}`
                      : isActive
                        ? "bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background"
                        : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : !isReachable ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                <span
                  className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "text-foreground font-bold underline underline-offset-4 decoration-2 decoration-blue-600"
                      : isComplete
                        ? "text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`mx-3 h-0.5 flex-1 rounded-full transition-all duration-300 ${
                    index < highestCompletedStep ? "bg-green-400" : "bg-muted"
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