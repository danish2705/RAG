import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
  deviationFolder: string;
  changeControlFolder: string;
}

export interface AzureConfig {
  connectionString: string | undefined;
  container: string;
}

export interface GateConfig {
  confidenceThreshold: number;
}

export interface Config {
  llm: LlmConfig;
  embeddings: EmbeddingsConfig;
  kb: KbConfig;
  azure: AzureConfig;
  gate: GateConfig;
  port: number;
  databaseUrl: DatabaseConfig;
}

export const config: Config = {
  databaseUrl: {
    url: process.env.DATABASE_URL!,
  },
  llm: {
    apiUrl: process.env.API_URL,
    apiKey: process.env.API_KEY,
    model: process.env.LLM_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
  },
  embeddings: {
    model:
      process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
    apiUrl:
      process.env.EMBEDDING_API_URL ||
      `https://router.huggingface.co/hf-inference/models/${
        process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2"
      }/pipeline/feature-extraction`,
    apiKey: process.env.API_KEY,
  },
  kb: {
    deviationFolder: process.env.DEVIATION_FOLDER || "deviation",
    changeControlFolder: process.env.CHANGE_CONTROL_FOLDER || "changecontrol",
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    container: process.env.AZURE_KB_CONTAINER || "lifescience-kb",
  },
  gate: {
    // Feature 2: confidence threshold used by the gate between pipeline stages.
    confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? 70),
  },
  port: Number(process.env.PORT ?? 3000),
};
