import { readRequestBytes } from "../security/body.ts";
import { createHash } from "node:crypto";
import { AppError } from "../security/errors.ts";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
// Multipart framing (boundaries, part headers) on top of the file itself.
const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

export type DocumentKind = "pdf" | "txt";
export interface UploadedDocument {
  kind: DocumentKind;
  filename: string;
  bytes: Buffer;
  sha256: string;
}

const kinds = {
  pdf: { mime: "application/pdf", extension: ".pdf" },
  txt: { mime: "text/plain", extension: ".txt" },
} as const;

/** Display-safe basename: no paths, control characters or markup; bounded length. */
export function sanitizeFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} ._()-]/gu, "_")
    .replace(/\s+/g, " ")
    .replace(/^[ .]+/, "")
    .trim();
  if (!cleaned) return "document";
  if (cleaned.length <= 120) return cleaned;
  const dot = cleaned.lastIndexOf(".");
  const extension = dot > 0 ? cleaned.slice(dot).slice(0, 10) : "";
  return cleaned.slice(0, 120 - extension.length) + extension;
}

function hasPdfSignature(bytes: Buffer) {
  return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
}

/** Plain text must be valid UTF-8 without binary control bytes. */
function isPlainText(bytes: Buffer) {
  if (hasPdfSignature(bytes)) return false;
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  return !/[\u0000-\u0008\u000B\u000E-\u001F\u007F]/.test(text);
}

/**
 * Checks declared MIME type, extension AND content signature. All three must agree;
 * a mismatch is rejected rather than guessed. File contents are never executed.
 */
export function validateDocument(
  name: string,
  declaredType: string,
  bytes: Buffer,
): UploadedDocument {
  if (bytes.length === 0)
    throw new AppError(400, "EMPTY_FILE", "The selected file is empty.");
  if (bytes.length > MAX_UPLOAD_BYTES)
    throw new AppError(413, "FILE_TOO_LARGE", "Files must be 5 MB or smaller.");
  const filename = sanitizeFilename(name);
  const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));
  const mime = declaredType.split(";")[0].trim().toLowerCase();
  const kind = (Object.keys(kinds) as DocumentKind[]).find(
    (key) => kinds[key].mime === mime,
  );
  if (!kind || kinds[kind].extension !== extension)
    throw new AppError(
      415,
      "UNSUPPORTED_FILE",
      "Only machine-readable PDF (.pdf) or plain text (.txt) files are supported.",
    );
  if (kind === "pdf" ? !hasPdfSignature(bytes) : !isPlainText(bytes))
    throw new AppError(
      415,
      "SIGNATURE_MISMATCH",
      kind === "pdf"
        ? "This file is labelled as a PDF but its contents are not a PDF."
        : "This file is labelled as text but contains binary or non-UTF-8 data.",
    );
  return {
    kind,
    filename,
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

/** Reads one `file` field from a bounded multipart/form-data body. */
export async function readDocumentUpload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data;\s*boundary=/i.test(contentType))
    throw new AppError(
      415,
      "MULTIPART_REQUIRED",
      "Upload the document as multipart/form-data.",
    );
  const body = await readRequestBytes(
    request,
    MAX_BODY_BYTES,
    new AppError(413, "FILE_TOO_LARGE", "Files must be 5 MB or smaller."),
    new AppError(400, "FILE_REQUIRED", "Choose a PDF or TXT file."),
  );
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(body), {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new AppError(400, "INVALID_UPLOAD", "The upload could not be read.");
  }
  const files = form.getAll("file");
  const extraFields = [...form.keys()].filter((key) => key !== "file");
  if (files.length !== 1 || extraFields.length || typeof files[0] === "string")
    throw new AppError(
      400,
      "FILE_REQUIRED",
      "Upload exactly one PDF or TXT file in the `file` field.",
    );
  const file = files[0] as File;
  return validateDocument(
    file.name,
    file.type,
    Buffer.from(await file.arrayBuffer()),
  );
}
