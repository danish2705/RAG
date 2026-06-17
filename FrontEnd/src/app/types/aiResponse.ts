export type RedirectTarget = 'Deviation' | 'Change Control' | 'None';
export type SeverityLevel = 'Critical' | 'Major' | 'Minor';

export interface ImpactAssessment {
  patient_safety: string;
  product_quality: string;
  data_integrity: string;
  regulatory: string;
  validated_state: string;
}

export interface CAPAData {
  root_cause_category: string;
  root_cause_description: string;
  correction: string;
  corrective_action: string;
  preventive_action: string;
}

export interface EffectivenessCheckData {
  required: boolean;
  duration_days: number;
  success_metric: string;
  data_source: string;
  responsible_role: string;
  rationale: string;
}

export interface AIResponse {
  classification: string;
  severity: SeverityLevel | string;
  confidence_score: number;
  rationale: string;
  impact_assessment: ImpactAssessment;
  recommended_actions: string[];
  requires_change_control: boolean;
  requires_human_confirmation: boolean;
  redirect_to: RedirectTarget;
  capa_data?: CAPAData;
  effectiveness_check?: EffectivenessCheckData;
}

export const impactLevelToStatus = (level: string): 'High' | 'Medium' | 'Low' | 'None' => {
  const normalized = level.toLowerCase();
  if (normalized.includes('high')) return 'High';
  if (normalized.includes('medium')) return 'Medium';
  if (normalized.includes('low')) return 'Low';
  return 'None';
};
