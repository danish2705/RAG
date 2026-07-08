import type { Request, Response } from "express";
import { retrieveContext } from "../kb/knowledgeBase.js";
import {
  runClassificationOnly,
  runImpactAssessmentOnly,
  runRCAOnly,
  runCAPAOnly,
} from "../pipeline/deviation/orchestrator.js";
import {
  ClassificationSchema,
  ImpactAssessmentSchema,
  RCASchema,
} from "../llm/schemas/deviation.js";

interface InputQueryBody {
  query?: unknown;
}

// Classification / routing ONLY.
export async function inputQuery(req: Request, res: Response): Promise<void> {
  const { query } = (req.body ?? {}) as InputQueryBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const { contextText, routing } = await retrieveContext(query);
  const result = await runClassificationOnly(query, contextText);
  res.json({ query, routing, ...result });
}

interface ImpactAssessmentBody {
  query?: unknown;
  classification?: unknown;
}

// Impact / severity assessment.
export async function impactAssessment(
  req: Request,
  res: Response,
): Promise<void> {
  const { query, classification } = (req.body ?? {}) as ImpactAssessmentBody;

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
        "Request body must include a valid 'classification' object (the approved Stage 1 result).",
      details: parsedClassification.error.flatten(),
    });
    return;
  }

  const { contextText } = await retrieveContext(query);
  const result = await runImpactAssessmentOnly(
    query,
    contextText,
    parsedClassification.data,
  );
  res.json({ query, ...result });
}

interface RCABody {
  query?: unknown;
  classification?: unknown;
  impactAssessment?: unknown;
}

// Root cause analysis.
export async function rca(req: Request, res: Response): Promise<void> {
  const {
    query,
    classification,
    impactAssessment: impact,
  } = (req.body ?? {}) as RCABody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedClassification = ClassificationSchema.safeParse(classification);
  if (!parsedClassification.success) {
    res.status(400).json({
      error: "Request body must include a valid 'classification' object.",
      details: parsedClassification.error.flatten(),
    });
    return;
  }

  const parsedImpactAssessment = ImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpactAssessment.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'impactAssessment' object (the approved Stage 2 result).",
      details: parsedImpactAssessment.error.flatten(),
    });
    return;
  }

  const { contextText } = await retrieveContext(query);
  const result = await runRCAOnly(
    query,
    contextText,
    parsedClassification.data,
    parsedImpactAssessment.data,
  );
  res.json({ query, ...result });
}

interface CAPABody {
  query?: unknown;
  classification?: unknown;
  impactAssessment?: unknown;
  rca?: unknown;
}

// CAPA recommendations.
export async function capa(req: Request, res: Response): Promise<void> {
  const {
    query,
    classification,
    impactAssessment: impact,
    rca: rcaBody,
  } = (req.body ?? {}) as CAPABody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  const parsedClassification = ClassificationSchema.safeParse(classification);
  if (!parsedClassification.success) {
    res.status(400).json({
      error: "Request body must include a valid 'classification' object.",
      details: parsedClassification.error.flatten(),
    });
    return;
  }

  const parsedImpactAssessment = ImpactAssessmentSchema.safeParse(impact);
  if (!parsedImpactAssessment.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'impactAssessment' object (the approved Stage 2 result).",
      details: parsedImpactAssessment.error.flatten(),
    });
    return;
  }

  const parsedRCA = RCASchema.safeParse(rcaBody);
  if (!parsedRCA.success) {
    res.status(400).json({
      error:
        "Request body must include a valid 'rca' object (the approved Stage 3 result).",
      details: parsedRCA.error.flatten(),
    });
    return;
  }

  const result = await runCAPAOnly(
    query,
    parsedClassification.data,
    parsedImpactAssessment.data,
    parsedRCA.data,
  );
  res.json({ query, ...result });
}
