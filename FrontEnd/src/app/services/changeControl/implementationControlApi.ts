import { apiFetch } from "../../utils/api";
import type { RiskCriticalityParsed, GateResult } from "../../types/pipeline";
import type { FlatChangeImpactAssessment } from "../../utils/changeImpactAdapter";
import type {
  FlatValidationTesting,
  FlatImplementationControl,
} from "../../utils/changeControlAdapters";

export interface RawImplementationControlApiResponse {
  status?: string;
  haltedAt?: string | null;
  auditTrail?: unknown[];
  query?: string;
  stages?: {
    implementationControl?: {
      rawText: string;
      parsed: FlatImplementationControl | null;
      error: unknown;
      gate: GateResult;
    };
  };
}

export const generateImplementationControl = async (
  query: string,
  changeImpactAssessment: FlatChangeImpactAssessment | null,
  riskCriticality: RiskCriticalityParsed | null,
  validationTesting: FlatValidationTesting | null,
): Promise<RawImplementationControlApiResponse> => {
  return apiFetch("/api/change-control/implementation-control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      changeImpactAssessment,
      riskCriticality,
      validationTesting,
    }),
  });
};
