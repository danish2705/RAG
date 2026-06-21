import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";
import { config } from "../config.js";
import type { SourceDoc } from "./chunker.js";

export async function listLocalPdfFiles(folder: string): Promise<string[]> {
  const dirPath = path.join(config.kb.localPath, folder.replace(/\/$/, ""));

  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    throw new Error(
      `Knowledge base folder not found: ${dirPath}. Create it and add PDF files (see kb-data/ in the project root).`,
    );
  }

  return entries
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(dirPath, f));
}

/** Equivalent to loadPdfFromS3(key), but reads from local disk. */
export async function loadPdfFromDisk(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const { text } = await pdfParse(buffer);
  return text ?? "";
}

/**
 * Drop-in replacement for loadKnowledgeBase() in s3Loader.ts.
 * Same signature (folder/prefix + docType), same return shape (SourceDoc[]),
 * so knowledgeBase.ts doesn't need to change how it calls this.
 */
export async function loadKnowledgeBase(
  folder: string,
  docType: string,
): Promise<SourceDoc[]> {
  const filePaths = await listLocalPdfFiles(folder);

  if (filePaths.length === 0) {
    console.warn(
      `No PDF files found in ${path.join(config.kb.localPath, folder)} — index for "${docType}" will be empty.`,
    );
  }

  const docs: SourceDoc[] = [];
  for (const filePath of filePaths) {
    const content = await loadPdfFromDisk(filePath);
    docs.push({ content, source: filePath, type: docType });
  }

  return docs;
}
