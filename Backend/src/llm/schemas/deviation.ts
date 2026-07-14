import { z } from "zod";

export const SeverityLevel = z.enum(["None", "Minor", "Major", "Critical"]);
export type SeverityLevel = z.infer<typeof SeverityLevel>;

const ImpactParameter = z.object({
  severity: SeverityLevel,
  rationale: z.string().min(1),
});

export const ClassificationSchema = z.object({
  classification: z.enum(["Deviation", "Change Control"]),
  rationale: z.array(z.string().min(1)).min(1),
  confidence_score: z.number().min(0).max(100),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export const InsufficientInputSchema = z.object({
  insufficient_input: z.literal(true),
  reason: z.string().min(1),
});

export type InsufficientInputResult = z.infer<typeof InsufficientInputSchema>;

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

export const RCASchema = z.object({
  sequence_of_events: z.array(z.string()),
  immediate_cause: z.string().min(1),
  primary_root_cause: z.string().min(1),
  contributing_factors: z.array(z.string()),
  evidence: z.array(z.string()),
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
