import { initKnowledgeBase, retrieveContext } from "./kb/knowledgeBase.js";
import { runDeviationPipeline } from "./pipeline/orchestrator.js";

// Equivalent to the notebook's last cell: print(run_agent(query))
const query = `
Title: Document refrigerator temperature excursion
Type: Process
Description: Refrigerator exceeded temperature limits yesterday for 3 hours during storage of a commercial batch.
`.trim();

async function main(): Promise<void> {
  console.log("Loading knowledge base...");
  await initKnowledgeBase();

  console.log("Running pipeline...\n");
  const { contextText, routing } = await retrieveContext(query);
  const result = await runDeviationPipeline(query, contextText);

  console.log("Routing:", routing);
  console.log("\nResult:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
