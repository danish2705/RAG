import { apiFetch } from "../../utils/api";
import type {
  ClassificationParsed,
  RiskCriticalityApiResponse,
} from "../../types/pipeline";
import type { FlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";

export const generateRiskCriticality = async (
  query: string,
  classification: ClassificationParsed | null,
  changeImpactAssessment: FlatChangeImpactAssessment,
): Promise<RiskCriticalityApiResponse> => {
  return apiFetch("/api/change-control/risk-criticality", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, classification, changeImpactAssessment }),
  });
};
