import { loadKnowledgeBase } from "./localLoader.js";
import { prepareChunks } from "./chunker.js";
import { buildIndex, retrieve, } from "./vectorStore.js";
import { classifyQueryType, routeToSources, } from "./router.js";
import { config } from "../config.js";
let devIndex;
let ccIndex;
let initPromise;
/**
 * Loads both knowledge bases from local disk (kb-data/deviation and
 * kb-data/changecontrol) and builds their vector indexes.
  */
export function initKnowledgeBase() {
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
export async function retrieveContext(query) {
    if (!devIndex || !ccIndex) {
        throw new Error("Knowledge base not initialized. Call initKnowledgeBase() first.");
    }
    const routing = await classifyQueryType(query);
    const sources = routeToSources(routing.type);
    const chunks = [];
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
//# sourceMappingURL=knowledgeBase.js.map