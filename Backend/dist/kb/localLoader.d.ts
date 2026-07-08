import type { SourceDoc } from "./chunker.js";
export declare function listLocalPdfFiles(folder: string): Promise<string[]>;
/**readsfrom local disk. */
export declare function loadPdfFromDisk(filePath: string): Promise<string>;
/**
 * Loads all PDFs from a subfolder of the local kb-data directory,
 * tagging each document with the given docType ('deviation' | 'change_control').
 */
export declare function loadKnowledgeBase(folder: string, docType: string): Promise<SourceDoc[]>;
