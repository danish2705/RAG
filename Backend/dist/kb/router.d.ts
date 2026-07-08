export type QueryType = "deviation" | "change_control" | "hybrid";
export interface QueryRouting {
    type: QueryType | string;
    confidence: string;
    reason: string;
}
/** Equivalent to classify_query(query) in the notebook, minus the silent fallback. */
export declare function classifyQueryType(query: string): Promise<QueryRouting>;
export declare function routeToSources(queryType: string): Array<"deviation" | "change_control">;
