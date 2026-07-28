import { useEffect } from "react";
import { Check, Lock } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

export type Classification = "Deviation" | "Change Control" | "Hybrid";

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
  "/deviation/summary": 5,
};

// NOTE: keys must match routes.tsx exactly.
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

// The two flows share Step 0 (Intake) and Step 1 (Classification), so both
// ratchets must be namespaced consistently and both read/written the SAME
// way regardless of which top-level branch below decided to render them.
// This is what previously let the Deviation and Change Control ratchets
// drift out of sync with each other on the shared pages.
const DEVIATION_STORAGE_KEY = "qms_deviation_max_step";
const CHANGE_CONTROL_STORAGE_KEY = "qms_cc_max_step";

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

// Ground truth read. NOT cached in React state — called fresh on every
// single render. sessionStorage is the one durable source of truth; this
// function's job is just to reconcile it with the step the URL says we're
// on right now. Because nothing here depends on when a mount/remount/effect
// happened to run, there is no possible render where a stale, lower value
// can flash on screen — every render sees the real current value.
function readHighestCompletedStep(storageKey: string, currentStep: number): number {
  if (typeof window === "undefined") return currentStep;
  const saved = sessionStorage.getItem(storageKey);
  const savedValue = saved !== null ? parseInt(saved, 10) : 0;
  return Math.max(Number.isFinite(savedValue) ? savedValue : 0, currentStep);
}

// Idempotent persistence: only writes when the URL has pushed the ratchet
// further than what's stored. Never call this with a value that could move
// the ratchet backward — highestCompletedStep passed in must already be the
// reconciled Math.max() from readHighestCompletedStep above.
function usePersistHighestCompletedStep(storageKey: string, highestCompletedStep: number) {
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    const savedValue = saved !== null ? parseInt(saved, 10) : 0;
    if (highestCompletedStep > savedValue) {
      sessionStorage.setItem(storageKey, highestCompletedStep.toString());
    }
  }, [storageKey, highestCompletedStep]);
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

  // Shared pages (Intake / Classification) where classification isn't known
  // yet: show both. Because both DeviationBar and ChangeControlBar now read
  // straight from sessionStorage on every render rather than caching a
  // value in state, whichever ratchet already has progress recorded (from a
  // prior visit deeper in that flow) will render correctly here too — there
  // is no separate "fresh mount" code path that could show a lower number.
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
  // currentActiveStep: derived directly from the URL, every render. This is
  // deliberately NOT its own useState — the URL is already the single
  // source of truth for "what page is being viewed," and duplicating it
  // into state would just create a second value that could drift out of
  // sync with actual routing.
  const currentActiveStep = DEVIATION_STEP_ROUTES[pathname] ?? 0;
  const steps = getDeviationSteps(classification);

  // highestCompletedStep: the other of the two independent states, read
  // fresh from sessionStorage every render (see readHighestCompletedStep).
  // An accepted CAPA step counts as completed even a beat before navigation
  // has physically caught up to the Summary page.
  const baseHighestCompletedStep = readHighestCompletedStep(DEVIATION_STORAGE_KEY, currentActiveStep);
  const highestCompletedStep = (capaAccepted || implementationAccepted)
    ? Math.max(baseHighestCompletedStep, CAPA_STEP_INDEX + 1)
    : baseHighestCompletedStep;

  usePersistHighestCompletedStep(DEVIATION_STORAGE_KEY, baseHighestCompletedStep);

  // Explicit reset: only when back at Intake with no case in progress.
  useEffect(() => {
    if (pathname === "/deviation" && !sessionStorage.getItem("qms_active_case")) {
      sessionStorage.removeItem(DEVIATION_STORAGE_KEY);
    }
  }, [pathname]);

  return (
    <ProgressBarShell
      steps={steps}
      currentActiveStep={currentActiveStep}
      highestCompletedStep={highestCompletedStep}
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
  const currentActiveStep = CHANGE_CONTROL_STEP_ROUTES[pathname] ?? 0;
  const steps = getChangeControlSteps(classification);

  const baseHighestCompletedStep = readHighestCompletedStep(CHANGE_CONTROL_STORAGE_KEY, currentActiveStep);
  // changeControlStepAccepted intentionally isn't folded in here — in the
  // original code it only ever referred to the *current* step, which the
  // active-step highlight already covers on its own; it never actually
  // extended how far the workflow had progressed.
  const highestCompletedStep = implementationAccepted
    ? Math.max(baseHighestCompletedStep, CC_IMPLEMENTATION_STEP_INDEX + 1)
    : baseHighestCompletedStep;

  usePersistHighestCompletedStep(CHANGE_CONTROL_STORAGE_KEY, baseHighestCompletedStep);

  useEffect(() => {
    if (pathname === "/deviation" && !sessionStorage.getItem("qms_active_case")) {
      sessionStorage.removeItem(CHANGE_CONTROL_STORAGE_KEY);
    }
  }, [pathname]);

  return (
    <ProgressBarShell
      steps={steps}
      currentActiveStep={currentActiveStep}
      highestCompletedStep={highestCompletedStep}
    />
  );
}

function ProgressBarShell({
  steps,
  currentActiveStep,
  highestCompletedStep,
}: {
  steps: { label: string; path: string }[];
  // Two independent states, per requirement — neither is derived from the
  // other, and the render below never uses currentActiveStep to decide the
  // green line, only to decide the active-step ring/highlight.
  currentActiveStep: number;
  highestCompletedStep: number;
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
          // Active: strictly the page currently being viewed.
          const isActive = index === currentActiveStep;

          // Completed: strictly index <= highestCompletedStep. Never
          // references currentActiveStep, so viewing an earlier completed
          // step never shortens or moves this.
          const isCompleted = index <= highestCompletedStep;

          // Sequential unlock gate: identical condition to isCompleted by
          // design — a step is clickable exactly when it's within the
          // workflow's completed history. Steps beyond highestCompletedStep
          // are locked, disabled, and unclickable, which is what prevents
          // jumping ahead to a future/incomplete step.
          const isUnlocked = index <= highestCompletedStep;

          return (
            <div
              key={step.label}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <button
                type="button"
                onClick={() => {
                  if (!isUnlocked) return;
                  handleStepClick(step.path);
                }}
                disabled={!isUnlocked}
                aria-disabled={!isUnlocked}
                aria-current={isActive ? "step" : undefined}
                className={`flex items-center gap-2 shrink-0 group focus:outline-none rounded-lg px-2 py-1 -mx-2 transition-all duration-200 ${
                  isUnlocked
                    ? "cursor-pointer hover:bg-muted/60 active:scale-95"
                    : "cursor-not-allowed opacity-50"
                }`}
                title={
                  isUnlocked
                    ? `Click to jump to ${step.label}`
                    : "Complete the previous steps to unlock this step"
                }
              >
                <div
                  className={`
                    flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold transition-all duration-200 shrink-0
                    ${isUnlocked ? "group-hover:scale-110 group-hover:shadow-md" : ""}
                    ${
                      isCompleted
                        ? `bg-green-500 text-white ${isActive ? "ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background font-bold" : "group-hover:bg-green-600"}`
                        : isActive
                          ? "bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background group-hover:bg-blue-700 font-bold"
                          : "bg-muted text-muted-foreground border border-border group-hover:border-blue-500/50 group-hover:text-foreground"
                    }
                  `}
                >
                  {/* Checkmark for every completed step in the ratchet history, active or not */}
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Active-step title gets an underline so the current page is
                    unambiguous at a glance. This is driven purely by isActive
                    (current URL), never by isCompleted/highestCompletedStep —
                    the underline and the green line are fully independent. */}
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isUnlocked ? "group-hover:underline group-hover:underline-offset-4" : ""
                  } ${
                    isActive
                      ? "text-foreground font-bold underline underline-offset-4 decoration-2 decoration-blue-600"
                      : isCompleted
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
                    // The green line reflects HIGHEST COMPLETED STEP ONLY —
                    // currentActiveStep never appears in this condition.
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