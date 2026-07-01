import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// function required(name: string, fallback?: string): string {
//   const val = process.env[name] ?? fallback;
//   if (val === undefined) {
//     throw new Error(`Missing required environment variable: ${name}`);
//   }
//   return val;
// }

export interface LlmConfig {
  apiUrl: string | undefined;
  apiKey: string | undefined;
  model: string;
}

export interface EmbeddingsConfig {
  model: string;
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
    model: process.env.EMBEDDING_MODEL || "all-MiniLM-L6-v2",
  },
  kb: {
    // Reads PDFs from disk. Folder layout: <localPath>/deviation/*.pdf
    // and <localPath>/changecontrol/*.pdf
    localPath:
      process.env.KB_LOCAL_PATH || path.resolve(__dirname, "../kb-data"),
    deviationFolder: process.env.DEVIATION_FOLDER || "deviation",
    changeControlFolder: process.env.CHANGE_CONTROL_FOLDER || "changecontrol",
  },
  gate: {
    // Feature 2: confidence threshold used by the gate between pipeline stages.
    confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? 70),
  },
  port: Number(process.env.PORT ?? 3000),
};
