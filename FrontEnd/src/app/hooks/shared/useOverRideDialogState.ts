import { useReducer, useCallback } from "react";

interface OverrideDialogState {
  isOverrideEditing: boolean;
  overrideConfirmed: boolean;
  showOverrideDialog: boolean;
  overrideJustification: string;
  showRejectDialog: boolean;
  rejectJustification: string;
  showRationaleWarning: boolean;
  warningFields: string[];
  isSubmitting: boolean;
  submitError: string | null;
}

type Action =
  | { type: "SET_OVERRIDE_EDITING"; value: boolean }
  | { type: "SET_OVERRIDE_CONFIRMED"; value: boolean }
  | { type: "SET_SHOW_OVERRIDE_DIALOG"; value: boolean }
  | { type: "SET_OVERRIDE_JUSTIFICATION"; value: string }
  | { type: "SET_SHOW_REJECT_DIALOG"; value: boolean }
  | { type: "SET_REJECT_JUSTIFICATION"; value: string }
  | { type: "SET_SHOW_RATIONALE_WARNING"; value: boolean }
  | { type: "SET_WARNING_FIELDS"; value: string[] }
  // Combined actions: several related fields change together, atomically,
  // as a single dispatch/render instead of several separate setter calls.
  | { type: "CONFIRM_OVERRIDE" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_FAILURE"; error: string }
  | { type: "RESET_ON_HYDRATE" };

const initialState: OverrideDialogState = {
  isOverrideEditing: false,
  overrideConfirmed: false,
  showOverrideDialog: false,
  overrideJustification: "",
  showRejectDialog: false,
  rejectJustification: "",
  showRationaleWarning: false,
  warningFields: [],
  isSubmitting: false,
  submitError: null,
};

function reducer(
  state: OverrideDialogState,
  action: Action,
): OverrideDialogState {
  switch (action.type) {
    case "SET_OVERRIDE_EDITING":
      return { ...state, isOverrideEditing: action.value };
    case "SET_OVERRIDE_CONFIRMED":
      return { ...state, overrideConfirmed: action.value };
    case "SET_SHOW_OVERRIDE_DIALOG":
      return { ...state, showOverrideDialog: action.value };
    case "SET_OVERRIDE_JUSTIFICATION":
      return { ...state, overrideJustification: action.value };
    case "SET_SHOW_REJECT_DIALOG":
      return { ...state, showRejectDialog: action.value };
    case "SET_REJECT_JUSTIFICATION":
      return { ...state, rejectJustification: action.value };
    case "SET_SHOW_RATIONALE_WARNING":
      return { ...state, showRationaleWarning: action.value };
    case "SET_WARNING_FIELDS":
      return { ...state, warningFields: action.value };
    case "CONFIRM_OVERRIDE":
      // Was 4 separate setState calls at the call site in every hook;
      // now guaranteed to always change together.
      return {
        ...state,
        showOverrideDialog: false,
        isOverrideEditing: false,
        overrideConfirmed: true,
        overrideJustification: "",
      };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, submitError: null };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_FAILURE":
      return { ...state, isSubmitting: false, submitError: action.error };
    case "RESET_ON_HYDRATE":
      // Used when a fresh AI result lands in the store (e.g. re-running
      // an assessment) — clears any in-progress override state so the
      // form doesn't show stale "overridden" UI for new data.
      return {
        ...state,
        overrideConfirmed: false,
        isOverrideEditing: false,
      };
    default:
      return state;
  }
}

export function useOverrideDialogState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setIsOverrideEditing = useCallback(
    (value: boolean) => dispatch({ type: "SET_OVERRIDE_EDITING", value }),
    [],
  );
  const setOverrideConfirmed = useCallback(
    (value: boolean) => dispatch({ type: "SET_OVERRIDE_CONFIRMED", value }),
    [],
  );
  const setShowOverrideDialog = useCallback(
    (value: boolean) => dispatch({ type: "SET_SHOW_OVERRIDE_DIALOG", value }),
    [],
  );
  const setOverrideJustification = useCallback(
    (value: string) => dispatch({ type: "SET_OVERRIDE_JUSTIFICATION", value }),
    [],
  );
  const setShowRejectDialog = useCallback(
    (value: boolean) => dispatch({ type: "SET_SHOW_REJECT_DIALOG", value }),
    [],
  );
  const setRejectJustification = useCallback(
    (value: string) => dispatch({ type: "SET_REJECT_JUSTIFICATION", value }),
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
  const confirmOverride = useCallback(
    () => dispatch({ type: "CONFIRM_OVERRIDE" }),
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
    setIsOverrideEditing,
    setOverrideConfirmed,
    setShowOverrideDialog,
    setOverrideJustification,
    setShowRejectDialog,
    setRejectJustification,
    setShowRationaleWarning,
    setWarningFields,
    confirmOverride,
    submitStart,
    submitSuccess,
    submitFailure,
    resetOnHydrate,
  };
}
