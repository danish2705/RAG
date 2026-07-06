import { z } from "zod";

export const SeverityLevel = z.enum(["None", "Minor", "Major", "Critical"]);
export type SeverityLevel = z.infer<typeof SeverityLevel>;

const ImpactParameter = z.object({
  severity: SeverityLevel,
  rationale: z.string().min(1),
});

// rationale is now an array of bullet-point strings
// NOTE: routing decision ONLY. Severity/impact is a separate stage
// (ImpactAssessmentSchema below) that only runs after a human approves
// this classification — see pipeline/impactAssessment.ts.
export const ClassificationSchema = z.object({
  classification: z.enum(["Deviation", "Change Control", "Hybrid"]),
  rationale: z.array(z.string().min(1)).min(1),
  confidence_score: z.number().min(0).max(100),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

// Stage 2: impact/severity assessment. Only invoked after a human has
// accepted (or overridden) the Stage 1 classification above.
export const ImpactAssessmentSchema = z.object({
  impact_assessment: z.object({
    product_impact: ImpactParameter,
    patient_impact: ImpactParameter,
    data_integrity_impact: ImpactParameter,
    compliance_impact: ImpactParameter,
  }),
  confidence_score: z.number().min(0).max(100),
});

export type ImpactAssessmentResult = z.infer<typeof ImpactAssessmentSchema>;

// sequence_of_events, contributing_factors, evidence — all plain string arrays
export const RCASchema = z.object({
  sequence_of_events: z.array(z.string()),
  immediate_cause: z.string().min(1),
  primary_root_cause: z.string().min(1),
  contributing_factors: z.array(z.string()),
  evidence: z.array(z.string()),
  // Renamed from "impact_assessment" -> "impact_summary" to avoid colliding
  // with the Stage 2 ImpactAssessmentResult (a structured object with
  // per-parameter severity levels). This field is just a short prose
  // recap of impact, written by the RCA stage itself.
  impact_summary: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type RCAResult = z.infer<typeof RCASchema>;

export const CAPASchema = z.object({
  capa_required: z.boolean(),
  corrective_actions: z.array(z.string()),
  preventive_actions: z.array(z.string()),
  effectiveness_check: z.string(),
  due_date: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type CAPAResult = z.infer<typeof CAPASchema>;
