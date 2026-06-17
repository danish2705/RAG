declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    [key: string]: unknown;
  }

  interface PDFMetadata {
    [key: string]: unknown;
  }

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }

  interface PDFParseOptions {
    pagerender?: (pageData: unknown) => string | Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PDFParseOptions
  ): Promise<PDFParseResult>;

  export = pdfParse;
}
