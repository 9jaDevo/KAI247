// Deterministic builder for SYNTHETIC test PDFs. No external tooling, no real documents.
// textPdf(): one text-layer page per entry (Helvetica, WinAnsi).
// imageOnlyPdf(): a page containing only an image, simulating a scanned PDF without text.

const latin1 = (value) => Buffer.from(value, "latin1");
const escapeText = (line) =>
  line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function assemble(objects) {
  const chunks = [latin1("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  let offset = chunks[0].length;
  const offsets = [];
  objects.forEach((body, index) => {
    offsets.push(offset);
    const head = latin1(`${index + 1} 0 obj\n`);
    const tail = latin1("\nendobj\n");
    const content = Buffer.isBuffer(body) ? body : latin1(body);
    chunks.push(head, content, tail);
    offset += head.length + content.length + tail.length;
  });
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.map((value) => `${String(value).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`,
  ].join("");
  chunks.push(latin1(xref));
  return Buffer.concat(chunks);
}

function stream(dictionary, data) {
  const bytes = Buffer.isBuffer(data) ? data : latin1(data);
  return Buffer.concat([
    latin1(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`),
    bytes,
    latin1("\nendstream"),
  ]);
}

/** @param {string[][]} pages lines of text per page */
export function textPdf(pages) {
  // 1 catalog, 2 pages, 3 font, then (page, content) pairs.
  const pageIds = pages.map((_, index) => 4 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  pages.forEach((lines, index) => {
    const contentId = pageIds[index] + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    const body = [
      "BT",
      "/F1 11 Tf",
      "14 TL",
      "56 780 Td",
      ...lines.map((line) => `(${escapeText(line)}) Tj T*`),
      "ET",
    ].join("\n");
    objects.push(stream("", body));
  });
  return assemble(objects);
}

export function imageOnlyPdf() {
  const pixels = Buffer.alloc(64 * 64, 0xd0);
  return assemble([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>",
    stream(
      "/Type /XObject /Subtype /Image /Width 64 /Height 64 /ColorSpace /DeviceGray /BitsPerComponent 8",
      pixels,
    ),
    stream("", "q 480 0 0 680 56 80 cm /Im1 Do Q"),
  ]);
}
