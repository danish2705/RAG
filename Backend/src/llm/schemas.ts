import { z } from "zod";

// Equivalent to ClassificationResponse(BaseModel) in the notebook.
export const ClassificationSchema = z.object({
  classification: z.string().min(1),
  rationale: z.string().min(1),
  impact_assessment: z.object({
    product_impact: z.string(),
    patient_impact: z.string(),
    data_integrity_impact: z.string(),
    compliance_impact: z.string(),
  }),
  confidence_score: z.number().min(0).max(100),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

// Equivalent to RCAAnalysis(BaseModel) in the notebook.
export const RCASchema = z.object({
  sequence_of_events: z.array(z.string()),
  immediate_cause: z.string().min(1),
  primary_root_cause: z.string().min(1),
  contributing_factors: z.array(z.string()),
  evidence: z.array(z.string()),
  impact_assessment: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type RCAResult = z.infer<typeof RCASchema>;

// Equivalent to CAPAPlan(BaseModel) in the notebook.
export const CAPASchema = z.object({
  capa_required: z.boolean(),
  corrective_actions: z.array(z.string()),
  preventive_actions: z.array(z.string()),
  effectiveness_check: z.string(),
  due_date: z.string(),
  confidence_score: z.number().min(0).max(100),
});

export type CAPAResult = z.infer<typeof CAPASchema>;
