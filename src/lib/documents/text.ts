import { AppError } from "../security/errors.ts";
import type { UploadedDocument } from "./upload.ts";

export const MAX_PDF_PAGES = 30;
const PARSE_TIMEOUT_MS = 15_000;

export interface DocumentText {
  method: "txt_utf8" | "pdf_text_layer";
  /** Page texts in order. TXT files are one page with no page number semantics. */
  pages: string[];
  paged: boolean;
}

/** Keeps characters/positions intact apart from line endings and control bytes. */
export function normalizeExtractedText(text: string) {
  return text
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .normalize("NFC");
}

function withTimeout<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new AppError(
              422,
              "PARSE_TIMEOUT",
              "Reading this document took too long. Try a smaller machine-readable file.",
            ),
          ),
        PARSE_TIMEOUT_MS,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

async function pdfPages(bytes: Buffer) {
  const { getDocumentProxy, extractText } = await import("unpdf");
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    pdf = await getDocumentProxy(new Uint8Array(bytes), {
      verbosity: 0,
      stopAtErrors: true,
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException")
      throw new AppError(
        422,
        "PDF_ENCRYPTED",
        "Password-protected PDFs are not supported. Upload an unlocked copy.",
      );
    throw new AppError(
      422,
      "MALFORMED_DOCUMENT",
      "This PDF could not be read. It may be damaged or not a real PDF.",
    );
  }
  try {
    if (pdf.numPages > MAX_PDF_PAGES)
      throw new AppError(
        422,
        "TOO_MANY_PAGES",
        `PDFs are limited to ${MAX_PDF_PAGES} pages.`,
      );
    const { text } = await extractText(pdf, { mergePages: false });
    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      422,
      "MALFORMED_DOCUMENT",
      "This PDF could not be read. It may be damaged or not a real PDF.",
    );
  } finally {
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
}

/**
 * Deterministic text extraction. PDFs must already contain a text layer: scanned
 * image-only PDFs fail with NO_TEXT_LAYER. OCR is NOT implemented.
 */
export async function extractDocumentText(
  document: Pick<UploadedDocument, "kind" | "bytes">,
): Promise<DocumentText> {
  const pages =
    document.kind === "txt"
      ? [new TextDecoder("utf-8").decode(document.bytes)]
      : await withTimeout(pdfPages(document.bytes));
  const normalized = pages.map(normalizeExtractedText);
  const visible = normalized.join("").replace(/\s+/g, "").length;
  if (visible < 10)
    throw new AppError(
      422,
      document.kind === "pdf" ? "NO_TEXT_LAYER" : "EMPTY_TEXT",
      document.kind === "pdf"
        ? "This PDF has no extractable text layer (it may be a scan or photo). OCR is not supported; upload a machine-readable PDF or a TXT file."
        : "This text file has no readable content.",
    );
  return {
    method: document.kind === "pdf" ? "pdf_text_layer" : "txt_utf8",
    pages: normalized,
    paged: document.kind === "pdf",
  };
}
