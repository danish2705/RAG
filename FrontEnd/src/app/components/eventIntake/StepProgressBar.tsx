import { useEffect } from "react";
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
   * Unique id of the event/case currently open (ticket number, deviation id,
   * whatever your app already generates when a case is created). Whenever
   * this value changes from what it was last render, progress is reset —
   * this is the ONLY reliable way to tell "still reviewing the same case"
   * apart from "a new event intake just started," since both can land on
   * the exact same "/deviation" URL.
   *
   * If you don't have this wired up yet, call `resetStepProgress()`
   * (exported below) directly from whatever button/action starts a new
   * case, as a manual fallback.
   */
  caseId?: string | number | null;
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

const DEVIATION_HIGHEST_KEY = "qms_progress_deviation_highest";
const CHANGE_CONTROL_HIGHEST_KEY = "qms_progress_cc_highest";
const CASE_OWNER_KEY = "qms_progress_owner_case_id";

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

// Ground-truth read, done fresh every render — never cached in useState, so
// there's no stale copy that can flash the wrong value after a remount.
function readHighestReached(storageKey: string, currentStep: number): number {
  if (typeof window === "undefined") return currentStep;
  const saved = sessionStorage.getItem(storageKey);
  const savedValue = saved !== null ? parseInt(saved, 10) : 0;
  return Math.max(Number.isFinite(savedValue) ? savedValue : 0, currentStep);
}

// Only ever moves the ratchet forward.
function usePersistHighestReached(storageKey: string, highestReached: number) {
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    const savedValue = saved !== null ? parseInt(saved, 10) : 0;
    if (highestReached > savedValue) {
      sessionStorage.setItem(storageKey, highestReached.toString());
    }
  }, [storageKey, highestReached]);
}

/**
 * Wipes all stored progress for both flows. Call this directly from
 * whatever action actually starts a brand-new event/case — the guaranteed
 * way to reset, independent of any id-matching heuristics.
 */
export function resetStepProgress() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEVIATION_HIGHEST_KEY);
  sessionStorage.removeItem(CHANGE_CONTROL_HIGHEST_KEY);
  sessionStorage.removeItem(CASE_OWNER_KEY);
}

// Automatic counterpart: if the case id you're passing in has changed since
// last render, treat it as a new event intake and reset. Runs once per
// render, before anything reads the ratchet, so the same render already
// reflects the reset — no flash of the previous case's progress.
function resetIfCaseChanged(caseId: string | number | null | undefined) {
  if (typeof window === "undefined") return;
  if (caseId === undefined || caseId === null || caseId === "") return; // can't detect without an id
  const signal = String(caseId);
  const owner = sessionStorage.getItem(CASE_OWNER_KEY);
  if (signal === owner) return;
  resetStepProgress();
  sessionStorage.setItem(CASE_OWNER_KEY, signal);
}

export function StepProgressBar({ classification, caseId }: StepProgressBarProps) {
  const { pathname } = useLocation();

  resetIfCaseChanged(caseId);

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
        <ChangeControlBar pathname={pathname} classification={classification} />
      </div>
    );
  }

  if (showDeviationOnly) {
    return (
      <div className="mb-6">
        <DeviationBar pathname={pathname} classification={classification} />
      </div>
    );
  }

  // Classification not decided yet (Intake / AI Classification) — show both.
  return (
    <div className="space-y-3 mb-6">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Deviation Path
        </p>
        <DeviationBar pathname={pathname} classification={classification} />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
          Change Control Path
        </p>
        <ChangeControlBar pathname={pathname} classification={classification} />
      </div>
    </div>
  );
}

function DeviationBar({ pathname, classification }: { pathname: string; classification?: Classification }) {
  const currentActiveStep = DEVIATION_STEP_ROUTES[pathname] ?? 0;
  const highestReached = readHighestReached(DEVIATION_HIGHEST_KEY, currentActiveStep);
  usePersistHighestReached(DEVIATION_HIGHEST_KEY, highestReached);

  return (
    <Bar steps={deviationSteps(classification)} currentActiveStep={currentActiveStep} highestReached={highestReached} />
  );
}

function ChangeControlBar({ pathname, classification }: { pathname: string; classification?: Classification }) {
  const currentActiveStep = CHANGE_CONTROL_STEP_ROUTES[pathname] ?? 0;
  const highestReached = readHighestReached(CHANGE_CONTROL_HIGHEST_KEY, currentActiveStep);
  usePersistHighestReached(CHANGE_CONTROL_HIGHEST_KEY, highestReached);

  return (
    <Bar steps={changeControlSteps(classification)} currentActiveStep={currentActiveStep} highestReached={highestReached} />
  );
}

/**
 * Unlock rule: index <= highestReached. highestReached only ever grows, so
 * once you've reached step n and go back to review step n-2, everything up
 * through n stays unlocked — going back doesn't shrink what you can reach.
 * The active-step highlight is a completely separate condition (isActive),
 * so it can move around freely without touching the green line at all.
 */
function Bar({
  steps,
  currentActiveStep,
  highestReached,
}: {
  steps: Step[];
  currentActiveStep: number;
  highestReached: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="bg-card border border-border rounded-xl px-6 py-4 w-full shadow-sm"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isActive = index === currentActiveStep;
          const isPassed = index < highestReached;
          const isReachable = index <= highestReached;

          return (
            <div key={step.path} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                disabled={!isReachable}
                aria-disabled={!isReachable}
                aria-current={isActive ? "step" : undefined}
                onClick={() => isReachable && navigate(step.path, { state: location.state })}
                title={isReachable ? `Go to ${step.label}` : "Complete the earlier steps first"}
                className={`flex items-center gap-2 shrink-0 group focus:outline-none rounded-lg px-2 py-1 -mx-2 transition-all duration-200 ${
                  isReachable ? "cursor-pointer hover:bg-muted/60 active:scale-95" : "cursor-not-allowed opacity-50"
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-full w-8 h-8 text-sm font-semibold shrink-0 transition-all duration-200 ${
                    isReachable ? "group-hover:scale-110 group-hover:shadow-md" : ""
                  } ${
                    isActive
                      ? "bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-2 ring-offset-background"
                      : isPassed
                        ? "bg-green-500 text-white group-hover:bg-green-600"
                        : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isPassed ? (
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
                      : isPassed
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
                    index < highestReached ? "bg-green-400" : "bg-muted"
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