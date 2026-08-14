import { z } from "zod";

export const SeverityLevel = z.enum(["None", "Minor", "Major", "Critical"]);
export type SeverityLevel = z.infer<typeof SeverityLevel>;

const ImpactParameter = z.object({
  severity: SeverityLevel,
  rationale: z.string().min(1),
  /**
   * Knowledge-base source document names that specifically informed THIS
   * parameter's rating — a subset of the stage's overall retrieved sources.
   * May be empty if no KB criteria clearly applied to this parameter.
   */
  sources: z.array(z.string()).default([]),
});

export const ClassificationSchema = z.object({
  classification: z.enum(["Deviation", "Change Control"]),
  rationale: z.array(z.string().min(1)).min(1),
  /**
   * Knowledge-base source document names that informed each rationale
   * bullet — same order/length as "rationale". May contain an empty array
   * for a bullet that was grounded only in the Event Description.
   */
  rationale_sources: z.array(z.array(z.string())).optional(),
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
  /** KB source document names that back immediate_cause. */
  immediate_cause_sources: z.array(z.string()).default([]),
  primary_root_cause: z.string().min(1),
  /** KB source document names that back primary_root_cause. */
  primary_root_cause_sources: z.array(z.string()).default([]),
  contributing_factors: z.array(z.string()),
  /** KB source document names per contributing_factors entry, same order/length. */
  contributing_factors_sources: z.array(z.array(z.string())).optional(),
  evidence: z.array(z.string()),
  /** KB source document names per evidence entry, same order/length. */
  evidence_sources: z.array(z.array(z.string())).optional(),
  impact_summary: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type RCAResult = z.infer<typeof RCASchema>;

export const CAPASchema = z.object({
  capa_required: z.boolean(),
  corrective_actions: z.array(z.string()),
  /** KB source document names per corrective_actions entry, same order/length. */
  corrective_actions_sources: z.array(z.array(z.string())).optional(),
  preventive_actions: z.array(z.string()),
  /** KB source document names per preventive_actions entry, same order/length. */
  preventive_actions_sources: z.array(z.array(z.string())).optional(),
  effectiveness_check: z.string(),
  /** KB source document names that back effectiveness_check. */
  effectiveness_check_sources: z.array(z.string()).default([]),
  due_date: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type CAPAResult = z.infer<typeof CAPASchema>;
