import { useReducer, useCallback } from "react";

interface SubmissionDialogState {
  showDiscardDialog: boolean;
  discardJustification: string;
  showRationaleWarning: boolean;
  warningFields: string[];
  isSubmitting: boolean;
  submitError: string | null;
}

type Action =
  | { type: "SET_SHOW_DISCARD_DIALOG"; value: boolean }
  | { type: "SET_DISCARD_JUSTIFICATION"; value: string }
  | { type: "SET_SHOW_RATIONALE_WARNING"; value: boolean }
  | { type: "SET_WARNING_FIELDS"; value: string[] }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_FAILURE"; error: string }
  | { type: "RESET_ON_HYDRATE" };

const initialState: SubmissionDialogState = {
  showDiscardDialog: false,
  discardJustification: "",
  showRationaleWarning: false,
  warningFields: [],
  isSubmitting: false,
  submitError: null,
};

function reducer(
  state: SubmissionDialogState,
  action: Action,
): SubmissionDialogState {
  switch (action.type) {
    case "SET_SHOW_DISCARD_DIALOG":
      return { ...state, showDiscardDialog: action.value };
    case "SET_DISCARD_JUSTIFICATION":
      return { ...state, discardJustification: action.value };
    case "SET_SHOW_RATIONALE_WARNING":
      return { ...state, showRationaleWarning: action.value };
    case "SET_WARNING_FIELDS":
      return { ...state, warningFields: action.value };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, submitError: null };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_FAILURE":
      return { ...state, isSubmitting: false, submitError: action.error };
    case "RESET_ON_HYDRATE":
      // Used when a fresh AI result lands in the store (e.g. re-running
      // an assessment) — clears any in-progress dialog state so the form
      // doesn't show stale UI for new data. There's no override mode to
      // reset anymore since every field is directly editable at all times.
      return { ...state, showRationaleWarning: false, warningFields: [] };
    default:
      return state;
  }
}

/**
 * Shared discard-dialog / rationale-warning / submit state used by the CAPA,
 * Risk & Criticality, Implementation & Control, Change Impact Assessment,
 * and Validation & Testing review hooks. (Previously also carried an
 * Override-mode toggle + justification dialog; that concept is gone now
 * that every field is naturally editable, so accept/discard are the only
 * decisions left to track here.)
 */
export function useOverrideDialogState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setShowDiscardDialog = useCallback(
    (value: boolean) => dispatch({ type: "SET_SHOW_DISCARD_DIALOG", value }),
    [],
  );
  const setDiscardJustification = useCallback(
    (value: string) => dispatch({ type: "SET_DISCARD_JUSTIFICATION", value }),
    [],
  );
  const setShowRationaleWarning = useCallback(
    (value: boolean) => dispatch({ type: "SET_SHOW_RATIONALE_WARNING", value }),
    [],
  );
  const setWarningFields = useCallback(
    (value: string[]) => dispatch({ type: "SET_WARNING_FIELDS", value }),
    [],
  );
  const submitStart = useCallback(() => dispatch({ type: "SUBMIT_START" }), []);
  const submitSuccess = useCallback(
    () => dispatch({ type: "SUBMIT_SUCCESS" }),
    [],
  );
  const submitFailure = useCallback(
    (error: string) => dispatch({ type: "SUBMIT_FAILURE", error }),
    [],
  );
  const resetOnHydrate = useCallback(
    () => dispatch({ type: "RESET_ON_HYDRATE" }),
    [],
  );

  return {
    ...state,
    setShowDiscardDialog,
    setDiscardJustification,
    setShowRationaleWarning,
    setWarningFields,
    submitStart,
    submitSuccess,
    submitFailure,
    resetOnHydrate,
  };
}