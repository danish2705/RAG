import { AIResponse } from '../types/aiResponse';

// Example 1: GxP Deviation + Change Control Required
export const exampleGxpDeviationWithChangeControl: AIResponse = {
  classification: 'gxp_deviation',
  severity: 'Critical',
  confidence_score: 92,
  rationale: `Key factors considered:
• Temperature excursion exceeded acceptable limits by 8°C
• Duration of excursion: 2.5 hours
• Cold storage critical for product stability
• Similar historical events classified as Major Deviation (3 matches found)
• Regulatory requirements (21 CFR Part 211) applicable
• This event may require changes to temperature monitoring systems

Reference standards:
• 21 CFR Part 211.142 - Warehousing procedures
• ICH Q7 - Good Manufacturing Practice Guide
• Company SOP-QA-045: Deviation Classification`,
  impact_assessment: {
    patient_safety: 'High',
    product_quality: 'High',
    data_integrity: 'Low',
    regulatory: 'High',
    validated_state: 'Medium',
  },
  recommended_actions: [
    'Initiate formal deviation investigation within 24 hours',
    'Quarantine all affected product batches immediately',
    'Review temperature monitoring logs for the past 30 days',
    'Notify Quality Assurance and regulatory affairs teams',
    'Prepare regulatory notification if required by local regulations',
    'Initiate change control for temperature monitoring system upgrade',
  ],
  requires_change_control: true,
  requires_human_confirmation: true,
  redirect_to: 'None',
};

// Example 2: GxP Deviation WITHOUT Change Control
export const exampleGxpDeviationNoChangeControl: AIResponse = {
  classification: 'gxp_deviation',
  severity: 'Major',
  confidence_score: 88,
  rationale: `Key factors considered:
• Documentation error identified during routine review
• No impact to product quality or safety
• Procedure deviation limited to administrative controls
• Correctable through training and process clarification
• No system or equipment changes required

Reference standards:
• Company SOP-QA-045: Deviation Classification
• ICH Q10 - Pharmaceutical Quality System`,
  impact_assessment: {
    patient_safety: 'None',
    product_quality: 'Low',
    data_integrity: 'Medium',
    regulatory: 'Low',
    validated_state: 'None',
  },
  recommended_actions: [
    'Complete deviation investigation within standard timeline',
    'Provide targeted training to affected personnel',
    'Update relevant SOPs for clarity',
    'Implement enhanced review procedures',
  ],
  requires_change_control: false,
  requires_human_confirmation: true,
  redirect_to: 'None',
};

// Example 3: Planned Departure (No Change Control)
export const examplePlannedDeparture: AIResponse = {
  classification: 'planned_departure',
  severity: 'Minor',
  confidence_score: 95,
  rationale: `Key factors considered:
• Pre-approved temporary deviation from standard procedure
• Risk assessment completed prior to execution
• All required approvals obtained in advance
• Documented justification and contingency plans in place
• Time-limited scope with defined return-to-normal criteria

Reference standards:
• Company SOP-QA-067: Planned Deviations and Temporary Changes
• ICH Q9 - Quality Risk Management`,
  impact_assessment: {
    patient_safety: 'None',
    product_quality: 'Low',
    data_integrity: 'None',
    regulatory: 'Low',
    validated_state: 'None',
  },
  recommended_actions: [
    'Monitor execution of planned departure according to approved protocol',
    'Document all activities and observations',
    'Conduct post-execution review',
    'Verify return to standard procedures',
  ],
  requires_change_control: false,
  requires_human_confirmation: true,
  redirect_to: 'None',
};

// Example 4: Event requiring redirect to Change Control
export const exampleRedirectToChangeControl: AIResponse = {
  classification: 'gxp_deviation',
  severity: 'Critical',
  confidence_score: 96,
  rationale: `Key factors considered:
• This event identifies a systematic issue requiring permanent system changes
• Root cause analysis points to equipment design limitation
• Similar events have occurred multiple times (5 instances in past 6 months)
• Permanent corrective action requires validated system modification
• Meets criteria for formal change control rather than simple deviation handling

Reference standards:
• Company SOP-QA-045: Deviation Classification
• Company SOP-CC-001: Change Control Procedures
• ICH Q9 - Quality Risk Management`,
  impact_assessment: {
    patient_safety: 'High',
    product_quality: 'High',
    data_integrity: 'Medium',
    regulatory: 'High',
    validated_state: 'High',
  },
  recommended_actions: [
    'Initiate formal Change Control process',
    'Conduct comprehensive risk assessment',
    'Develop validation protocol for system modifications',
    'Implement interim controls while change is being implemented',
    'Prepare regulatory notification as appropriate',
  ],
  requires_change_control: true,
  requires_human_confirmation: true,
  redirect_to: 'Change Control',
};

// Change Control Example: Major Change
export const exampleMajorChange: AIResponse = {
  classification: 'major_change',
  severity: 'Major',
  confidence_score: 95,
  rationale: `Key decision factors:
• Change affects commercial manufacturing lifecycle phase
• Impacts validated software system (LIMS)
• Potential GMP compliance implications under 21 CFR Part 11
• May require computer system validation (CSV) activities
• Similar changes historically classified as Major (87% match rate)

Regulatory considerations:
• 21 CFR Part 11 - Electronic Records and Signatures
• EU GMP Annex 11 - Computerized Systems
• ICH Q9 - Quality Risk Management`,
  impact_assessment: {
    patient_safety: 'Medium',
    product_quality: 'High',
    data_integrity: 'High',
    regulatory: 'High',
    validated_state: 'High',
  },
  recommended_actions: [
    'Complete impact assessment across all quality areas',
    'Develop validation protocol if system changes are required',
    'Obtain cross-functional approval (QA, IT, Validation, Operations)',
    'Consider regulatory notification requirements',
    'Establish rollback plan and testing strategy',
  ],
  requires_change_control: true,
  requires_human_confirmation: true,
  redirect_to: 'None',
};
