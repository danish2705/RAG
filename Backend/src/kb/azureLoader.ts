import { BlobServiceClient } from "@azure/storage-blob";
import pdfParse from "pdf-parse";
import { config } from "../config.js";
import type { SourceDoc } from "./chunker.js";

let cachedServiceClient: BlobServiceClient | undefined;

function getServiceClient(): BlobServiceClient {
  if (!config.azure.connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not set - required to read the KB from Azure Blob Storage.",
    );
  }

  if (!cachedServiceClient) {
    cachedServiceClient = BlobServiceClient.fromConnectionString(
      config.azure.connectionString,
    );
  }

  return cachedServiceClient;
}

/**
 * Lists all PDF blobs under a "folder" prefix in the KB container.
 * Azure Blob Storage has no real folders - "deviation/foo.pdf" is just a
 * blob name with a "/" in it, so we list by prefix instead of readdir.
 */
export async function listAzurePdfBlobs(folder: string): Promise<string[]> {
  const containerClient = getServiceClient().getContainerClient(
    config.azure.container,
  );

  const prefix = `${folder.replace(/\/$/, "")}/`;
  const blobNames: string[] = [];

  try {
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      if (blob.name.toLowerCase().endsWith(".pdf")) {
        blobNames.push(blob.name);
      }
    }
  } catch (err) {
    throw new Error(
      `Failed to list blobs under "${prefix}" in container "${config.azure.container}": ${
        (err as Error).message
      }`,
    );
  }

  return blobNames;
}

/** Downloads a blob and extracts its PDF text. */
export async function loadPdfFromAzure(blobName: string): Promise<string> {
  const containerClient = getServiceClient().getContainerClient(
    config.azure.container,
  );
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const buffer = await blockBlobClient.downloadToBuffer();
  const { text } = await pdfParse(buffer);
  return text ?? "";
}

/**
 * Loads all PDFs from a "folder" (blob name prefix) in the Azure KB
 * container, tagging each document with the given docType
 * ('deviation' | 'change_control').
 */
export async function loadKnowledgeBaseFromAzure(
  folder: string,
  docType: string,
): Promise<SourceDoc[]> {
  const blobNames = await listAzurePdfBlobs(folder);

  if (blobNames.length === 0) {
    console.warn(
      `No PDF blobs found under "${folder}/" in container "${config.azure.container}" — index for "${docType}" will be empty.`,
    );
  }

  const docs: SourceDoc[] = [];
  for (const blobName of blobNames) {
    const content = await loadPdfFromAzure(blobName);
    // Use the blob name itself as doc_key - it's already a stable,
    // container-relative path (e.g. "deviation/foo.pdf"), so no
    // per-machine path normalization is needed like the local loader.
    docs.push({ content, source: blobName, type: docType });
  }

  return docs;
}
