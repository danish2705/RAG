import { z } from "zod";

// Severity scale for each of the 4 impact-assessment parameters.
// Adjust these labels if your SOP defines a different scale —
// nothing else in the pipeline hardcodes these strings except the prompt.
export const SeverityLevel = z.enum(["None", "Minor", "Major", "Critical"]);
export type SeverityLevel = z.infer<typeof SeverityLevel>;

// One impact parameter = a rated severity + the narrative justifying it.
// Replaces the old plain-string fields so severity is an enforced,
// machine-checkable value instead of free text the LLM could phrase any way.
const ImpactParameter = z.object({
  severity: SeverityLevel,
  rationale: z.string().min(1),
});

// Equivalent to ClassificationResponse(BaseModel) in the notebook.
export const ClassificationSchema = z.object({
  classification: z.string().min(1),
  rationale: z.string().min(1),
  impact_assessment: z.object({
    product_impact: ImpactParameter,
    patient_impact: ImpactParameter,
    data_integrity_impact: ImpactParameter,
    compliance_impact: ImpactParameter,
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
