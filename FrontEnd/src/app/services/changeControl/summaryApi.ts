import { apiFetch } from "../../utils/api";

export interface SaveChangeControlPayload {
  query: string;
  classification: any;
  change_impact_assessment: any;
  risk_criticality: any;
  validation_testing: any;
  implementation_control: any;
  final_summary: any;
  status: string;
  halted_at: string | null;
  saved_by: string;
  provenance: any;
}

export const saveChangeControlRecord = async (
  payload: SaveChangeControlPayload,
) => {
  return apiFetch("/api/change-control/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};
