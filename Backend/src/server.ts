import { app } from "./app.js";
import { config } from "./config.js";
import { initKnowledgeBase } from "./kb/knowledgeBase.js";
import { setReady } from "./middleware/requireReady.js";

// NOTE: left as-is during the structural refactor — flagged separately in
// the security review (disables TLS certificate verification process-wide).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function start(): Promise<void> {
  // Bind to 0.0.0.0 (not just localhost) and bind FIRST, before the slow
  // knowledge base load, so Render's port scan succeeds immediately.
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`GxP AI orchestrator listening on port ${config.port}`);
  });

  console.log(
    "Loading knowledge base from Azure Blob Storage and building vector indexes...",
  );
  await initKnowledgeBase();
  setReady(true);
  console.log("Knowledge base ready.");
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
