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

export interface AwsConfig {
  region: string;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucket: string | undefined;
  deviationPrefix: string;
  changeControlPrefix: string;
}

export interface LlmConfig {
  apiUrl: string | undefined;
  apiKey: string | undefined;
  model: string;
}

export interface EmbeddingsConfig {
  model: string;
}

export interface KbConfig {
  source: "local" | "s3";
  localPath: string;
}

export interface GateConfig {
  confidenceThreshold: number;
}

export interface Config {
  aws: AwsConfig;
  llm: LlmConfig;
  embeddings: EmbeddingsConfig;
  kb: KbConfig;
  gate: GateConfig;
  port: number;
}

export const config: Config = {
  aws: {
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    bucket: process.env.BUCKET_NAME,
    deviationPrefix: process.env.DEVIATION_PREFIX || "deviation/",
    changeControlPrefix: process.env.CHANGE_CONTROL_PREFIX || "changecontrol/",
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
    // "local" reads PDFs from disk (kb-data/), "s3" reads from the S3 bucket.
    source: (process.env.KB_SOURCE as "local" | "s3") || "local",
    localPath:
      process.env.KB_LOCAL_PATH || path.resolve(__dirname, "../kb-data"),
  },
  gate: {
    // Feature 2: confidence threshold used by the gate between pipeline stages.
    confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? 70),
  },
  port: Number(process.env.PORT ?? 3000),
};
