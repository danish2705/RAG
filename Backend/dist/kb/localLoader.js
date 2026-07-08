import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";
import { config } from "../config.js";
export async function listLocalPdfFiles(folder) {
    const dirPath = path.join(config.kb.localPath, folder.replace(/\/$/, ""));
    let entries;
    try {
        entries = await fs.readdir(dirPath);
    }
    catch {
        throw new Error(`Knowledge base folder not found: ${dirPath}. Create it and add PDF files (see kb-data/ in the project root).`);
    }
    return entries
        .filter((f) => f.toLowerCase().endsWith(".pdf"))
        .map((f) => path.join(dirPath, f));
}
/**readsfrom local disk. */
export async function loadPdfFromDisk(filePath) {
    const buffer = await fs.readFile(filePath);
    const { text } = await pdfParse(buffer);
    return text ?? "";
}
/**
 * Loads all PDFs from a subfolder of the local kb-data directory,
 * tagging each document with the given docType ('deviation' | 'change_control').
 */
export async function loadKnowledgeBase(folder, docType) {
    const filePaths = await listLocalPdfFiles(folder);
    if (filePaths.length === 0) {
        console.warn(`No PDF files found in ${path.join(config.kb.localPath, folder)} — index for "${docType}" will be empty.`);
    }
    const docs = [];
    for (const filePath of filePaths) {
        const content = await loadPdfFromDisk(filePath);
        // Use a path relative to kb.localPath (not the absolute filesystem path)
        // as doc_key, so it stays stable across machines/users who each have
        // kb-data mounted under a different absolute path (e.g. different
        // Windows usernames). Otherwise the same PDF gets a different doc_key
        // per person and buildIndex() re-embeds it as if it were new content.
        const relativeSource = path
            .relative(config.kb.localPath, filePath)
            .split(path.sep)
            .join("/"); // normalize Windows backslashes so the key is identical cross-platform too
        docs.push({ content, source: relativeSource, type: docType });
    }
    return docs;
}
//# sourceMappingURL=localLoader.js.map