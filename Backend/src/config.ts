import "dotenv/config";

function required(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

export interface AwsConfig {
  region: string;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucket: string;
  deviationPrefix: string;
  changeControlPrefix: string;
}

export interface LlmConfig {
  apiUrl: string;
  apiKey: string | undefined;
  model: string;
}

export interface EmbeddingsConfig {
  model: string;
}

export interface GateConfig {
  confidenceThreshold: number;
}

export interface Config {
  aws: AwsConfig;
  llm: LlmConfig;
  embeddings: EmbeddingsConfig;
  gate: GateConfig;
  port: number;
}

export const config: Config = {
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: required("KB_BUCKET_NAME", "k-b-docs"),
    deviationPrefix: process.env.DEVIATION_PREFIX || "deviation/",
    changeControlPrefix: process.env.CHANGE_CONTROL_PREFIX || "changecontrol/",
  },
  llm: {
    apiUrl: process.env.LLM_API_URL || "https://router.huggingface.co/v1/chat/completions",
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
  },
  embeddings: {
    model: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  },
  gate: {
    // Feature 2: confidence threshold used by the gate between pipeline stages.
    confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? 70),
  },
  port: Number(process.env.PORT ?? 3000),
};
