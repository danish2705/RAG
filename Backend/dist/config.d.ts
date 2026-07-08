export interface LlmConfig {
    apiUrl: string | undefined;
    apiKey: string | undefined;
    model: string;
}
export interface EmbeddingsConfig {
    model: string;
    apiUrl: string;
    apiKey: string | undefined;
}
export interface DatabaseConfig {
    url: string;
}
export interface KbConfig {
    localPath: string;
    deviationFolder: string;
    changeControlFolder: string;
}
export interface GateConfig {
    confidenceThreshold: number;
}
export interface Config {
    llm: LlmConfig;
    embeddings: EmbeddingsConfig;
    kb: KbConfig;
    gate: GateConfig;
    port: number;
    databaseUrl: DatabaseConfig;
}
export declare const config: Config;
