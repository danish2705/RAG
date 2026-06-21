import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { initKnowledgeBase, retrieveContext } from "./kb/knowledgeBase.js";
import { runDeviationPipeline } from "./pipeline/orchestrator.js";
import cors from "cors";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
app.use(express.json());
app.use(cors());

interface AnalyzeRequestBody {
  query?: unknown;
}

app.post("/api/inputQuery", async (req: Request, res: Response): Promise<void> => {
  const { query } = (req.body ?? {}) as AnalyzeRequestBody;

  if (typeof query !== "string" || query.trim().length === 0) {
    res.status(400).json({
      error: "Request body must include a non-empty 'query' string.",
    });
    return;
  }

  try {
    const { contextText, routing } = await retrieveContext(query);
    const result = await runDeviationPipeline(query, contextText);
    console.log(result)
    res.json({ query, routing, ...result });
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
