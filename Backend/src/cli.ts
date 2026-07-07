import { initKnowledgeBase, retrieveContext } from "./kb/knowledgeBase.js";
import {
  runClassificationOnly,
  runImpactAssessmentOnly,
  runRCAOnly,
  runCAPAOnly,
} from "./pipeline/deviation/orchestrator.js";

// Equivalent to the notebook's last cell: print(run_agent(query))
const query = `
Title: Document refrigerator temperature excursion
Type: Process
Description: Refrigerator exceeded temperature limits yesterday for 3 hours during storage of a commercial batch.
`.trim();

// NOTE: this CLI runs all 4 stages back-to-back for local testing
// convenience. In the real app each stage only fires after a human clicks
// Accept/Override on the corresponding frontend page — see server.ts for
// the actual per-stage endpoints. Don't take this file as a model for how
// the API should behave; it's a dev smoke test only.
async function main(): Promise<void> {
  console.log("Loading knowledge base...");
  await initKnowledgeBase();

  const { contextText, routing } = await retrieveContext(query);
  console.log("Routing:", routing);

  console.log("\n--- Stage 1: Classification ---");
  const classificationResult = await runClassificationOnly(query, contextText);
  console.log(JSON.stringify(classificationResult, null, 2));

  if (classificationResult.status === "halted_for_human_review") {
    console.log("\nHalted at classification — stopping here.");
    return;
  }

  const approvedClassification =
    classificationResult.stages.classification!.parsed!;

  console.log(
    "\n--- Stage 2: Impact Assessment (simulating human approval) ---",
  );
  const impactResult = await runImpactAssessmentOnly(
    query,
    contextText,
    approvedClassification,
  );
  console.log(JSON.stringify(impactResult, null, 2));

  if (impactResult.status === "halted_for_human_review") {
    console.log("\nHalted at impact assessment — stopping here.");
    return;
  }

  const approvedImpactAssessment =
    impactResult.stages.impactAssessment!.parsed!;

  console.log("\n--- Stage 3: RCA (simulating human approval) ---");
  const rcaResult = await runRCAOnly(
    query,
    contextText,
    approvedClassification,
    approvedImpactAssessment,
  );
  console.log(JSON.stringify(rcaResult, null, 2));

  if (rcaResult.status === "halted_for_human_review") {
    console.log("\nHalted at RCA — stopping here.");
    return;
  }

  const approvedRCA = rcaResult.stages.rca!.parsed!;

  console.log("\n--- Stage 4: CAPA (simulating human approval) ---");
  const capaResult = await runCAPAOnly(
    query,
    approvedClassification,
    approvedImpactAssessment,
    approvedRCA,
  );
  console.log(JSON.stringify(capaResult, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
