import { apiFetch } from "../../utils/api";
import type { RiskCriticalityParsed, GateResult } from "../../types/pipeline";
import type { FlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import type { FlatValidationTesting } from "../../utils/changeControlAdapters";

// Raw shape as returned by the backend, before flat->nested conversion.
// parsed/gate use the real pipeline types (not "any"/"unknown") so the
// calling hook's spread into a ValidationTestingStage type-checks —
// gate in particular must satisfy GateResult, not a loose placeholder.
export interface RawValidationTestingApiResponse {
  status?: string;
  haltedAt?: string | null;
  auditTrail?: unknown[];
  query?: string;
  stages?: {
    validationTesting?: {
      rawText: string;
      parsed: FlatValidationTesting | null;
      error: unknown;
      gate: GateResult;
    };
  };
}

export const generateValidationTesting = async (
  query: string,
  changeImpactAssessment: FlatChangeImpactAssessment,
  riskCriticality: RiskCriticalityParsed,
): Promise<RawValidationTestingApiResponse> => {
  return apiFetch("/api/change-control/validation-testing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, changeImpactAssessment, riskCriticality }),
  });
};
