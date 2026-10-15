// Regenerates the SYNTHETIC P3 PDF fixtures deterministically from the TXT sources.
import { readFile, writeFile } from "node:fs/promises";
import {
  textPdf,
  imageOnlyPdf,
} from "../tests/fixtures/documents/pdf-builder.mjs";

const dir = new URL("../tests/fixtures/documents/", import.meta.url);
const invoice = (
  await readFile(new URL("hosting-invoice-two-dates.txt", dir), "utf8")
)
  .replace(/\r\n?/g, "\n")
  .split("\n");
// Two pages: invoice details first, renewal terms on page 2 (exercises page numbers).
const split = invoice.findIndex((line) =>
  line.startsWith("Your hosting plan renews"),
);
await writeFile(
  new URL("hosting-invoice-two-dates.pdf", dir),
  textPdf([
    invoice.slice(0, split),
    ["Renewal terms", "", ...invoice.slice(split)],
  ]),
);
await writeFile(new URL("scanned-no-text.pdf", dir), imageOnlyPdf());
console.log(
  "Wrote hosting-invoice-two-dates.pdf and scanned-no-text.pdf (synthetic).",
);
