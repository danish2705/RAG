import type { AnyCase } from "../../types/Records";
import { DeviationViewModal } from "./DeviationViewModal";
import { ChangeControlViewModal } from "./ChangeControlViewModal";

export function CaseViewModal({
  record,
  onClose,
}: {
  record: AnyCase;
  onClose: () => void;
}) {
  if (record.case_type === "Change Control") {
    return <ChangeControlViewModal record={record} onClose={onClose} />;
  }
  return <DeviationViewModal record={record} onClose={onClose} />;
}