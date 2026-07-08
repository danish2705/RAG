const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  
  // --- TEMPORARY HACK FOR CHANGE CONTROL ---
  // This intercepts the missing URL before it even tries to make a network request
  if (path.includes("/api/change-control/change-impact-assessment")) {
    console.warn("Returning fake Change Control data directly from apiFetch!");
    return {
      status: "completed_pending_human_review",
      haltedAt: null,
      query: "Mock change control query",
      auditTrail: [],
      stages: {
        changeImpactAssessment: {
          rawText: "Mock response",
          error: null,
          gate: { stage: "impact_assessment", passed: true, reasons: [], routedTo: null },
          parsed: {
            impacted_systems: ["System A", "System B"],
            gxp_classification: { value: "Direct Impact", rationale: "Mock rationale" },
            data_validation_impact: { validated_state_affected: true, rationale: "Mock rationale" },
            downstream_dependencies: ["Reporting Tool X"],
            risk_scoring: { level: "Moderate", rationale: "Mock rationale" },
            confidence_score: 95
          }
        }
      }
    } as unknown as T;
  }
  // ------------------------------------------

  // Normal behavior for all other API calls (like Deviations)
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body?.error || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}