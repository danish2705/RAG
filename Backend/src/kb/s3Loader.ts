import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import pdfParse from "pdf-parse";
import { config } from "../config.js";
import type { SourceDoc } from "./chunker.js";

const s3 = new S3Client({
  region: config.aws.region,
  credentials: config.aws.accessKeyId
    ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey as string,
      }
    : undefined, // falls back to the default AWS SDK credential chain
});

/** Equivalent to list_files(prefix) in the notebook. */
export async function listPdfKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: config.aws.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of response.Contents ?? []) {
      if (obj.Key?.endsWith(".pdf")) keys.push(obj.Key);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Equivalent to load_pdf_from_s3(key) in the notebook. */
export async function loadPdfFromS3(key: string): Promise<string> {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: config.aws.bucket, Key: key })
  );
  const buffer = await streamToBuffer(response.Body as Readable);
  const { text } = await pdfParse(buffer);
  return text ?? "";
}

/** Equivalent to load_kb(prefix, doc_type) in the notebook. */
export async function loadKnowledgeBase(prefix: string, docType: string): Promise<SourceDoc[]> {
  const keys = await listPdfKeys(prefix);
  const docs: SourceDoc[] = [];

  for (const key of keys) {
    const content = await loadPdfFromS3(key);
    docs.push({ content, source: key, type: docType });
  }

  return docs;
}
