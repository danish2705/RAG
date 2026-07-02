export interface ImpactParameter {
  severity: "None" | "Minor" | "Major" | "Critical";
  rationale: string;
}

export interface ClassificationParsed {
  classification: "Deviation" | "Change Control" | "Hybrid";
  rationale: string[];
  confidence_score: number;
}

export interface ImpactAssessmentParsed {
  impact_assessment: {
    product_impact: ImpactParameter;
    patient_impact: ImpactParameter;
    data_integrity_impact: ImpactParameter;
    compliance_impact: ImpactParameter;
  };
  confidence_score: number;
}

export interface RCAResult {
  sequence_of_events: string[];
  immediate_cause: string;
  primary_root_cause: string;
  contributing_factors: string[];
  evidence: string[];
  impact_assessment: string;
  confidence_score: number;
}

export interface CAPAResult {
  capa_required: boolean;
  corrective_actions: string[];
  preventive_actions: string[];
  effectiveness_check: string;
  due_date: string;
  confidence_score: number;
}

export interface DeviationCase {
  id: number;
  query: string;
  saved_by: string;
  classification: ClassificationParsed | null;
  impact_assessment: ImpactAssessmentParsed | null;
  rca: RCAResult | null;
  capa: CAPAResult | null;
  status: string;
  created_at: string;
}



