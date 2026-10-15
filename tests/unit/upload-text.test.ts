import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  readDocumentUpload,
  sanitizeFilename,
  validateDocument,
} from "../../src/lib/documents/upload.ts";
import { extractDocumentText } from "../../src/lib/documents/text.ts";
import { AppError } from "../../src/lib/security/errors.ts";
import { textPdf, imageOnlyPdf } from "../fixtures/documents/pdf-builder.mjs";

const fixture = (name: string) =>
  readFileSync(new URL(`../fixtures/documents/${name}`, import.meta.url));
async function code(promise: Promise<unknown> | (() => unknown)) {
  try {
    await (typeof promise === "function" ? promise() : promise);
  } catch (error) {
    return error instanceof AppError ? error.code : String(error);
  }
  return "no error";
}
function multipart(
  parts: {
    name: string;
    filename?: string;
    type?: string;
    body: Buffer | string;
  }[],
) {
  const form = new FormData();
  for (const part of parts)
    if (part.filename)
      form.append(
        part.name,
        new File([new Uint8Array(Buffer.from(part.body))], part.filename, {
          type: part.type,
        }),
      );
    else form.append(part.name, String(part.body));
  return new Request("http://localhost:3000/api/extractions", {
    method: "POST",
    body: form,
  });
}

describe("upload validation (MIME + extension + signature)", () => {
  it("accepts a real text file and a real PDF, hashing the bytes", () => {
    const txt = validateDocument(
      "hosting.txt",
      "text/plain",
      fixture("hosting-invoice-two-dates.txt"),
    );
    expect(txt.kind).toBe("txt");
    expect(txt.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      validateDocument(
        "invoice.pdf",
        "application/pdf",
        fixture("hosting-invoice-two-dates.pdf"),
      ).kind,
    ).toBe("pdf");
  });
  it("rejects mismatched type, extension or content signature", async () => {
    const pdf = fixture("hosting-invoice-two-dates.pdf");
    const txt = fixture("ambiguous-date.txt");
    expect(await code(() => validateDocument("a.txt", "text/plain", pdf))).toBe(
      "SIGNATURE_MISMATCH",
    );
    expect(
      await code(() => validateDocument("a.pdf", "application/pdf", txt)),
    ).toBe("SIGNATURE_MISMATCH");
    expect(await code(() => validateDocument("a.pdf", "text/plain", txt))).toBe(
      "UNSUPPORTED_FILE",
    );
    expect(
      await code(() =>
        validateDocument("a.exe", "application/x-msdownload", txt),
      ),
    ).toBe("UNSUPPORTED_FILE");
    expect(
      await code(() =>
        validateDocument("a.png", "image/png", Buffer.from([0x89, 0x50])),
      ),
    ).toBe("UNSUPPORTED_FILE");
    expect(
      await code(() =>
        validateDocument(
          "bin.txt",
          "text/plain",
          Buffer.from([0x41, 0x00, 0x42]),
        ),
      ),
    ).toBe("SIGNATURE_MISMATCH");
    expect(
      await code(() =>
        validateDocument(
          "latin.txt",
          "text/plain",
          Buffer.from([0x41, 0xff, 0x42]),
        ),
      ),
    ).toBe("SIGNATURE_MISMATCH");
  });
  it("enforces empty and 5 MB limits", async () => {
    expect(
      await code(() =>
        validateDocument("e.txt", "text/plain", Buffer.alloc(0)),
      ),
    ).toBe("EMPTY_FILE");
    expect(
      await code(() =>
        validateDocument(
          "big.txt",
          "text/plain",
          Buffer.alloc(MAX_UPLOAD_BYTES + 1, 65),
        ),
      ),
    ).toBe("FILE_TOO_LARGE");
  });
  it("sanitizes filenames (paths, markup, control characters, length)", () => {
    expect(sanitizeFilename("../../etc/passwd.txt")).toBe("passwd.txt");
    expect(sanitizeFilename("C:\\Users\\x\\<script>.pdf")).toBe("_script_.pdf");
    expect(sanitizeFilename("a\u0000b.txt")).toBe("a_b.txt");
    expect(sanitizeFilename(`${"x".repeat(300)}.pdf`)).toHaveLength(120);
    expect(sanitizeFilename(`${"x".repeat(300)}.pdf`).endsWith(".pdf")).toBe(
      true,
    );
    expect(sanitizeFilename("...")).toBe("document");
  });
  it("reads exactly one multipart file field and rejects other shapes", async () => {
    const ok = await readDocumentUpload(
      multipart([
        {
          name: "file",
          filename: "notice.txt",
          type: "text/plain",
          body: fixture("ambiguous-date.txt"),
        },
      ]),
    );
    expect(ok.filename).toBe("notice.txt");
    expect(
      await code(
        readDocumentUpload(
          new Request("http://localhost/x", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
          }),
        ),
      ),
    ).toBe("MULTIPART_REQUIRED");
    expect(
      await code(
        readDocumentUpload(
          multipart([
            {
              name: "file",
              filename: "a.txt",
              type: "text/plain",
              body: "aaaaaaaaaaaa",
            },
            {
              name: "file",
              filename: "b.txt",
              type: "text/plain",
              body: "bbbbbbbbbbbb",
            },
          ]),
        ),
      ),
    ).toBe("FILE_REQUIRED");
    expect(
      await code(
        readDocumentUpload(
          multipart([
            {
              name: "file",
              filename: "a.txt",
              type: "text/plain",
              body: "aaaaaaaaaaaa",
            },
            { name: "organizationId", body: "000000000000000000000000" },
          ]),
        ),
      ),
    ).toBe("FILE_REQUIRED");
    expect(
      await code(
        readDocumentUpload(
          multipart([
            {
              name: "file",
              filename: "big.txt",
              type: "text/plain",
              body: Buffer.alloc(MAX_UPLOAD_BYTES + 70 * 1024, 65),
            },
          ]),
        ),
      ),
    ).toBe("FILE_TOO_LARGE");
  });
});

describe("deterministic text extraction (no OCR)", () => {
  it("extracts TXT as one unpaged text and normalizes line endings", async () => {
    const result = await extractDocumentText({
      kind: "txt",
      bytes: Buffer.from("\uFEFFLine one\r\nRenews 21 October 2027\r\n"),
    });
    expect(result).toEqual({
      method: "txt_utf8",
      pages: ["Line one\nRenews 21 October 2027\n"],
      paged: false,
    });
  });
  it("extracts PDF text layers per page, preserving source passages", async () => {
    const result = await extractDocumentText({
      kind: "pdf",
      bytes: fixture("hosting-invoice-two-dates.pdf"),
    });
    expect(result.method).toBe("pdf_text_layer");
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toContain("Invoice date: 14/10/2026");
    expect(result.pages[1]).toContain(
      "Your hosting plan renews on 21 October 2027.",
    );
  });
  it("fails deterministically for scanned/image-only, malformed and too-long PDFs", async () => {
    expect(
      await code(
        extractDocumentText({
          kind: "pdf",
          bytes: fixture("scanned-no-text.pdf"),
        }),
      ),
    ).toBe("NO_TEXT_LAYER");
    expect(
      await code(
        extractDocumentText({
          kind: "pdf",
          bytes: Buffer.from("%PDF-1.4\nthis is not a pdf body"),
        }),
      ),
    ).toBe("MALFORMED_DOCUMENT");
    expect(
      await code(
        extractDocumentText({
          kind: "pdf",
          bytes: textPdf(
            Array.from({ length: 31 }, (_, i) => [`Page ${i + 1}`]),
          ),
        }),
      ),
    ).toBe("TOO_MANY_PAGES");
    expect(
      await code(extractDocumentText({ kind: "pdf", bytes: imageOnlyPdf() })),
    ).toBe("NO_TEXT_LAYER");
    expect(
      await code(
        extractDocumentText({ kind: "txt", bytes: Buffer.from(" \n \n") }),
      ),
    ).toBe("EMPTY_TEXT");
  });
});
