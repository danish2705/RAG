import { apiFetch } from "../../utils/api";
import type { ClassificationParsed } from "../../types/pipeline";
import type { FlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";

export interface ChangeImpactAssessmentApiResponse {
  status: "halted_for_human_review" | "completed_pending_human_review";
  haltedAt: string | null;
  auditTrail: unknown[];
  query: string;
  stages: {
    changeImpactAssessment?: {
      rawText: string;
      parsed: FlatChangeImpactAssessment | null;
      error: unknown;
      gate: unknown;
    };
  };
}

export const assessChangeControlImpact = async (
  query: string,
  classification: ClassificationParsed,
): Promise<ChangeImpactAssessmentApiResponse> => {
  return apiFetch("/api/change-control/impact-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, classification }),
  });
};
