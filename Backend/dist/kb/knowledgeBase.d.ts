import { type RetrievedChunk } from "./vectorStore.js";
import { type QueryRouting } from "./router.js";
export interface RetrieveContextResult {
    contextText: string;
    chunks: RetrievedChunk[];
    routing: QueryRouting;
}
/**
 * Loads both knowledge bases from local disk (kb-data/deviation and
 * kb-data/changecontrol) and builds their vector indexes.
  */
export declare function initKnowledgeBase(): Promise<void>;
/**
 * Equivalent to Steps 1-3 of the notebook's run_agent(): classify the query
 * to pick a source, then retrieve context chunks from the relevant index/indexes.
 */
export declare function retrieveContext(query: string): Promise<RetrieveContextResult>;
