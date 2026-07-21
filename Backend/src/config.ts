import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface LlmConfig {
  endpoint: string | undefined; // e.g. https://<resource>.services.ai.azure.com/openai/v1
  apiKey: string | undefined;
  deployment: string; // Azure deployment name, sent as "model" in the body (e.g. "gpt-4.1")
  apiVersion: string | undefined; // optional on the v1 surface
}

export interface EmbeddingsConfig {
  endpoint: string | undefined; // e.g. https://<resource>.services.ai.azure.com/openai/v1
  apiKey: string | undefined;
  deployment: string; // Azure deployment name (e.g. "text-embedding-3-small")
  apiVersion: string | undefined; // optional on the v1 surface
  // text-embedding-3-small defaults to 1536 dims; Azure/OpenAI let you
  // request a smaller size via the "dimensions" param if set.
  dimensions: number | undefined;
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
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: process.env.AZURE_OPENAI_LLM_DEPLOYMENT || "gpt-4.1",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || undefined,
  },
  embeddings: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment:
      process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-small",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || undefined,
    dimensions: process.env.AZURE_OPENAI_EMBEDDING_DIMENSIONS
      ? Number(process.env.AZURE_OPENAI_EMBEDDING_DIMENSIONS)
      : undefined,
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
