import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
export const config = {
    databaseUrl: {
        url: process.env.DATABASE_URL,
    },
    llm: {
        apiUrl: process.env.API_URL,
        apiKey: process.env.API_KEY,
        model: process.env.LLM_MODEL || "meta-llama/Llama-3.1-8B-Instruct",
    },
    embeddings: {
        model: process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
        apiUrl: process.env.EMBEDDING_API_URL ||
            `https://router.huggingface.co/hf-inference/models/${process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2"}/pipeline/feature-extraction`,
        // Reuses the same HF token already used for chat completions (API_KEY).
        apiKey: process.env.API_KEY,
    },
    kb: {
        // Reads PDFs from disk. Folder layout: <localPath>/deviation/*.pdf
        // and <localPath>/changecontrol/*.pdf
        localPath: process.env.KB_LOCAL_PATH || path.resolve(__dirname, "../kb-data"),
        deviationFolder: process.env.DEVIATION_FOLDER || "deviation",
        changeControlFolder: process.env.CHANGE_CONTROL_FOLDER || "changecontrol",
    },
    gate: {
        // Feature 2: confidence threshold used by the gate between pipeline stages.
        confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD ?? 70),
    },
    port: Number(process.env.PORT ?? 3000),
};
//# sourceMappingURL=config.js.map