import { app } from "./app.js";
import { config } from "./config.js";
import { initKnowledgeBase } from "./kb/knowledgeBase.js";
import { setReady } from "./middleware/requireReady.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function start(): Promise<void> {
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
