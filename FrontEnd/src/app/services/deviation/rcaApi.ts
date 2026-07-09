import { apiFetch } from "../../utils/api";
import type { RCAApiResponse, ClassificationParsed } from "../../types/pipeline";

export const generateRootCauseAnalysis = async (
  query: string,
  classification: ClassificationParsed,
  impactAssessment: any
): Promise<RCAApiResponse> => {
  return apiFetch("/api/deviations/rca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, classification, impactAssessment }),
  });
};