import type { Request, Response } from "express";
import { retrieveContext } from "../kb/knowledgeBase.js";
import {
  runChangeImpactAssessmentOnly,
  runRiskCriticalityOnly,
  runValidationTestingOnly,
  runImplementationControlOnly,
  runFinalSummaryOnly,
} from "../pipeline/changeControl/orchestrator.js";
import {
  ChangeImpactAssessmentSchema,
  RiskCriticalitySchema,
  ValidationTestingSchema,
  ImplementationControlSchema,
} from "../llm/schemas/changeControl.js";
import { ClassificationSchema } from "../llm/schemas/deviation.js";

interface ChangeImpactAssessmentBody {
  query?: unknown;
  classification?: unknown;
}

// Change Impact Assessment (Stage 1).
export async function changeImpactAssessment(
  req: Request,
  res: Response,
): Promise<void> {
  const { query, classification } = (req.body ??
    {}) as ChangeImpactAssessmentBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedClassification = ClassificationSchema.safeParse(classification);
  if (!parsedClassification.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'classification' object (the approved Stage 0 result).",
      details: parsedClassification.error.flatten(),
    });
    return;
  }

  const { contextText } = await retrieveContext(query);
  const result = await runChangeImpactAssessmentOnly(
    query,
    contextText,
    parsedClassification.data,
  );
  res.json({ query, ...result });
}

interface RiskCriticalityBody {
  query?: unknown;
  changeImpactAssessment?: unknown;
}

// Risk & Criticality Evaluation (Stage 2).
export async function riskCriticality(
  req: Request,
  res: Response,
): Promise<void> {
  const { query, changeImpactAssessment: impact } = (req.body ??
    {}) as RiskCriticalityBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedImpact = ChangeImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpact.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
      details: parsedImpact.error.flatten(),
    });
    return;
  }

  const result = await runRiskCriticalityOnly(query, parsedImpact.data);
  res.json({ query, ...result });
}

interface ValidationTestingBody {
  query?: unknown;
  changeImpactAssessment?: unknown;
  riskCriticality?: unknown;
}

// Validation & Testing Strategy (Stage 3).
export async function validationTesting(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    query,
    changeImpactAssessment: impact,
    riskCriticality: risk,
  } = (req.body ?? {}) as ValidationTestingBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedImpact = ChangeImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpact.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
      details: parsedImpact.error.flatten(),
    });
    return;
  }

  const parsedRisk = RiskCriticalitySchema.safeParse(risk);
  if (!parsedRisk.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
      details: parsedRisk.error.flatten(),
    });
    return;
  }

  const result = await runValidationTestingOnly(
    query,
    parsedImpact.data,
    parsedRisk.data,
  );
  res.json({ query, ...result });
}

interface ImplementationControlBody {
  query?: unknown;
  changeImpactAssessment?: unknown;
  riskCriticality?: unknown;
  validationTesting?: unknown;
}

// Implementation & Control Actions (Stage 4).
export async function implementationControl(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    query,
    changeImpactAssessment: impact,
    riskCriticality: risk,
    validationTesting: validation,
  } = (req.body ?? {}) as ImplementationControlBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedImpact = ChangeImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpact.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
      details: parsedImpact.error.flatten(),
    });
    return;
  }

  const parsedRisk = RiskCriticalitySchema.safeParse(risk);
  if (!parsedRisk.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
      details: parsedRisk.error.flatten(),
    });
    return;
  }

  const parsedValidation = ValidationTestingSchema.safeParse(validation);
  if (!parsedValidation.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'validationTesting' object (the approved Stage 3 result).",
      details: parsedValidation.error.flatten(),
    });
    return;
  }

  const result = await runImplementationControlOnly(
    query,
    parsedImpact.data,
    parsedRisk.data,
    parsedValidation.data,
  );
  res.json({ query, ...result });
}

interface FinalSummaryBody {
  query?: unknown;
  changeImpactAssessment?: unknown;
  riskCriticality?: unknown;
  validationTesting?: unknown;
  implementationControl?: unknown;
}

// Final Change Control Summary (Stage 5).
export async function finalSummary(req: Request, res: Response): Promise<void> {
  const {
    query,
    changeImpactAssessment: impact,
    riskCriticality: risk,
    validationTesting: validation,
    implementationControl: implementation,
  } = (req.body ?? {}) as FinalSummaryBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedImpact = ChangeImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpact.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'changeImpactAssessment' object (the approved Stage 1 result).",
      details: parsedImpact.error.flatten(),
    });
    return;
  }

  const parsedRisk = RiskCriticalitySchema.safeParse(risk);
  if (!parsedRisk.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'riskCriticality' object (the approved Stage 2 result).",
      details: parsedRisk.error.flatten(),
    });
    return;
  }

  const parsedValidation = ValidationTestingSchema.safeParse(validation);
  if (!parsedValidation.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'validationTesting' object (the approved Stage 3 result).",
      details: parsedValidation.error.flatten(),
    });
    return;
  }

  const parsedImplementation =
    ImplementationControlSchema.safeParse(implementation);
  if (!parsedImplementation.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'implementationControl' object (the approved Stage 4 result).",
      details: parsedImplementation.error.flatten(),
    });
    return;
  }

  const result = await runFinalSummaryOnly(
    query,
    parsedImpact.data,
    parsedRisk.data,
    parsedValidation.data,
    parsedImplementation.data,
  );
  res.json({ query, ...result });
}
