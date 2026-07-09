import { apiFetch } from "../../utils/api";

export interface SaveDeviationPayload {
  query: string;
  classification: any;
  impact_assessment: any;
  rca: any;
  capa: any;
  status: string;
  halted_at: string | null;
  saved_by: string;
  provenance: any;
}

export const saveDeviationRecord = async (payload: SaveDeviationPayload) => {
  return apiFetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};