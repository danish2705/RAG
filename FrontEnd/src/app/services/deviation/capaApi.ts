import { apiFetch } from "../../utils/api";
import type { CAPAApiResponse, ClassificationParsed, ImpactAssessmentParsed, RCAResult } from "../../types/pipeline";

export const generateCapaRecommendations = async (
  query: string,
  classification: ClassificationParsed,
  impactAssessment: ImpactAssessmentParsed,
  rca: RCAResult
): Promise<CAPAApiResponse> => {
  return apiFetch("/api/deviations/capa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, classification, impactAssessment, rca }),
  });
};