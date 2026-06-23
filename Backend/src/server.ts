import express, { type Request, type Response } from "express";
import { pool } from "./db.js";
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
  classification?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────
// STAGE 2: Impact / severity assessment.
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
// STAGE 4: CAPA recommendations.
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
      const result = await runCAPAOnly(query, (rca ?? null) as never);
      res.json({ query, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────
// SAVE: Persist a completed pipeline result to the DB.
// ─────────────────────────────────────────────────────────────────────────
app.post("/api/save", async (req: Request, res: Response): Promise<void> => {
  const {
    query,
    classification,
    impact_assessment,
    rca,
    capa,
    status,
    halted_at,
    saved_by,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO deviation_cases
        (query, classification, impact_assessment, rca, capa, status, halted_at, saved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        query,
        JSON.stringify(classification),
        JSON.stringify(impact_assessment),
        JSON.stringify(rca),
        JSON.stringify(capa),
        status,
        halted_at,
        saved_by,
      ],
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET ALL CASES: Returns all saved deviation cases for the DB Log page.
// ─────────────────────────────────────────────────────────────────────────
app.get("/api/cases", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         query,
         saved_by,
         classification,
         impact_assessment,
         rca,
         capa,
         status,
         halted_at,
         created_at
       FROM deviation_cases
       ORDER BY created_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

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
