import { z } from "zod";
export declare const SeverityLevel: z.ZodEnum<["None", "Minor", "Major", "Critical"]>;
export type SeverityLevel = z.infer<typeof SeverityLevel>;
export declare const ClassificationSchema: z.ZodObject<{
    classification: z.ZodEnum<["Deviation", "Change Control", "Hybrid"]>;
    rationale: z.ZodArray<z.ZodString, "many">;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    rationale: string[];
    classification: "Deviation" | "Change Control" | "Hybrid";
    confidence_score: number;
}, {
    rationale: string[];
    classification: "Deviation" | "Change Control" | "Hybrid";
    confidence_score: number;
}>;
export type ClassificationResult = z.infer<typeof ClassificationSchema>;
export declare const ImpactAssessmentSchema: z.ZodObject<{
    impact_assessment: z.ZodObject<{
        product_impact: z.ZodObject<{
            severity: z.ZodEnum<["None", "Minor", "Major", "Critical"]>;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }>;
        patient_impact: z.ZodObject<{
            severity: z.ZodEnum<["None", "Minor", "Major", "Critical"]>;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }>;
        data_integrity_impact: z.ZodObject<{
            severity: z.ZodEnum<["None", "Minor", "Major", "Critical"]>;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }>;
        compliance_impact: z.ZodObject<{
            severity: z.ZodEnum<["None", "Minor", "Major", "Critical"]>;
            rationale: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }, {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        product_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        patient_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        data_integrity_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        compliance_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
    }, {
        product_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        patient_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        data_integrity_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        compliance_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
    }>;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    impact_assessment: {
        product_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        patient_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        data_integrity_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        compliance_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
    };
}, {
    confidence_score: number;
    impact_assessment: {
        product_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        patient_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        data_integrity_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
        compliance_impact: {
            severity: "None" | "Minor" | "Major" | "Critical";
            rationale: string;
        };
    };
}>;
export type ImpactAssessmentResult = z.infer<typeof ImpactAssessmentSchema>;
export declare const RCASchema: z.ZodObject<{
    sequence_of_events: z.ZodArray<z.ZodString, "many">;
    immediate_cause: z.ZodString;
    primary_root_cause: z.ZodString;
    contributing_factors: z.ZodArray<z.ZodString, "many">;
    evidence: z.ZodArray<z.ZodString, "many">;
    impact_summary: z.ZodString;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    sequence_of_events: string[];
    immediate_cause: string;
    primary_root_cause: string;
    contributing_factors: string[];
    evidence: string[];
    impact_summary: string;
}, {
    confidence_score: number;
    sequence_of_events: string[];
    immediate_cause: string;
    primary_root_cause: string;
    contributing_factors: string[];
    evidence: string[];
    impact_summary: string;
}>;
export type RCAResult = z.infer<typeof RCASchema>;
export declare const CAPASchema: z.ZodObject<{
    capa_required: z.ZodBoolean;
    corrective_actions: z.ZodArray<z.ZodString, "many">;
    preventive_actions: z.ZodArray<z.ZodString, "many">;
    effectiveness_check: z.ZodString;
    due_date: z.ZodString;
    confidence_score: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence_score: number;
    capa_required: boolean;
    corrective_actions: string[];
    preventive_actions: string[];
    effectiveness_check: string;
    due_date: string;
}, {
    confidence_score: number;
    capa_required: boolean;
    corrective_actions: string[];
    preventive_actions: string[];
    effectiveness_check: string;
    due_date: string;
}>;
export type CAPAResult = z.infer<typeof CAPASchema>;
