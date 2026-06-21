import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { initKnowledgeBase, retrieveContext } from "./kb/knowledgeBase.js";
import {
  runClassificationOnly,
  runImpactAssessmentOnly,
  runRCAOnly,
  runCAPAOnly,
} from "./pipeline/orchestrator.js";
import { ClassificationSchema } from "./llm/schemas.js";
import cors from "cors";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(express.json());
app.use(cors());

interface AnalyzeRequestBody {
  query?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 1: Classification / routing ONLY.
// Frontend: InputQuery.tsx submits the form here, then navigates to
// AIRecommendation.tsx with the result and STOPS — no further LLM call
// happens until the human clicks Accept/Override/Reject on that page.
// ─────────────────────────────────────────────────────────────────────────
app.post(
  "/api/inputQuery",
  async (req: Request, res: Response): Promise<void> => {
    const { query } = (req.body ?? {}) as AnalyzeRequestBody;

    if (typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({
        error: "Request body must include a non-empty 'query' string.",
      });
      return;
    }

    try {
      const { contextText, routing } = await retrieveContext(query);
      const result = await runClassificationOnly(query, contextText);
      res.json({ query, routing, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  },
);

interface ImpactAssessmentRequestBody {
  query?: unknown;
  classification?: unknown; // the (possibly human-overridden) Stage 1 result
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 2: Impact / severity assessment.
// Frontend: AIRecommendation.tsx's Accept/Override button calls THIS
// endpoint (not just a client-side navigate). Only fires after the human
// has made a routing decision. Re-runs KB retrieval against the same query
// so the severity stage gets fresh, relevant context.
// ─────────────────────────────────────────────────────────────────────────
app.post(
  "/api/deviations/impact-assessment",
  async (req: Request, res: Response): Promise<void> => {
    const { query, classification } = (req.body ??
      {}) as ImpactAssessmentRequestBody;

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

    try {
      const { contextText } = await retrieveContext(query);
      const result = await runImpactAssessmentOnly(
        query,
        contextText,
        parsedClassification.data,
      );
      res.json({ query, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  },
);

interface RCARequestBody {
  query?: unknown;
  classification?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 3: Root cause analysis.
// Frontend: ImpactAssessment.tsx's Accept/Override button should call this
// (today it just navigates client-side — same bug pattern, fix the same way
// you fix Stage 2).
// ─────────────────────────────────────────────────────────────────────────
app.post(
  "/api/deviations/rca",
  async (req: Request, res: Response): Promise<void> => {
    const { query, classification } = (req.body ?? {}) as RCARequestBody;

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

    try {
      const { contextText } = await retrieveContext(query);
      const result = await runRCAOnly(
        query,
        contextText,
        parsedClassification.data,
      );
      res.json({ query, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  },
);

interface CAPARequestBody {
  query?: unknown;
  rca?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 4: CAPA recommendations. Call only after RCA is accepted/overridden.
// ─────────────────────────────────────────────────────────────────────────
app.post(
  "/api/deviations/capa",
  async (req: Request, res: Response): Promise<void> => {
    const { query, rca } = (req.body ?? {}) as CAPARequestBody;

    if (typeof query !== "string" || query.trim().length === 0) {
      res.status(400).json({
        error: "Request body must include a non-empty 'query' string.",
      });
      return;
    }

    try {
      // rca is forwarded as-is (RCAStageResult["parsed"] shape); runCAPAOnly /
      // runCAPAStage validate it implicitly via the prompt + CAPASchema on the
      // way out, so no separate zod gate is needed on the way in here.
      const result = await runCAPAOnly(query, (rca ?? null) as never);
      res.json({ query, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  },
);

app.get("/healthz", (_req: Request, res: Response) =>
  res.json({ status: "ok" }),
);

async function start(): Promise<void> {
  console.log("Loading knowledge base from S3 and building vector indexes...");
  await initKnowledgeBase();
  console.log("Knowledge base ready.");

  app.listen(config.port, () => {
    console.log(`GxP AI orchestrator listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
