import { loadKnowledgeBase } from "./localLoader.js";
import { prepareChunks } from "./chunker.js";
import {
  buildIndex,
  retrieve,
  type VectorIndex,
  type RetrievedChunk,
} from "./vectorStore.js";
import {
  classifyQueryType,
  routeToSources,
  type QueryRouting,
} from "./router.js";
import { config } from "../config.js";

let devIndex: VectorIndex | undefined;
let ccIndex: VectorIndex | undefined;
let initPromise: Promise<void> | undefined;

export interface RetrieveContextResult {
  contextText: string;
  chunks: RetrievedChunk[];
  routing: QueryRouting;
}

/**
 * Loads both knowledge bases from local disk (kb-data/deviation and
 * kb-data/changecontrol) and builds their vector indexes.
 *
 * Call this once at startup (server.ts / cli.ts both do this).
 */
export function initKnowledgeBase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const [deviationDocs, ccDocs] = await Promise.all([
        loadKnowledgeBase(config.kb.deviationFolder, "deviation"),
        loadKnowledgeBase(config.kb.changeControlFolder, "change_control"),
      ]);

      devIndex = await buildIndex(prepareChunks(deviationDocs));
      ccIndex = await buildIndex(prepareChunks(ccDocs));
    })();
  }

  return initPromise;
}

/**
 * Equivalent to Steps 1-3 of the notebook's run_agent(): classify the query
 * to pick a source, then retrieve context chunks from the relevant index/indexes.
 */
export async function retrieveContext(
  query: string,
): Promise<RetrieveContextResult> {
  if (!devIndex || !ccIndex) {
    throw new Error(
      "Knowledge base not initialized. Call initKnowledgeBase() first.",
    );
  }

  const routing = await classifyQueryType(query);
  const sources = routeToSources(routing.type);

  const chunks: RetrievedChunk[] = [];
  if (sources.includes("deviation")) {
    chunks.push(...(await retrieve(query, devIndex)));
  }
  if (sources.includes("change_control")) {
    chunks.push(...(await retrieve(query, ccIndex)));
  }

  return {
    contextText: chunks.map((c) => c.text).join("\n"),
    chunks,
    routing,
  };
}
