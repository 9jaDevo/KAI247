// REAL Gemma inference proof over the SYNTHETIC P3 fixtures, through the same code path
// the app uses (validation → text extraction → prompt → Gemma adapter → Zod → evidence).
// Writes a sanitized report: no API key, no prompt text, no non-synthetic content.
// Usage: npm run ai:proof   (requires GEMMA_* in .env; makes real, possibly billed calls)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { validateDocument } from "../src/lib/documents/upload.ts";
import { extractDocumentText } from "../src/lib/documents/text.ts";
import { buildExtractionPrompt, PROMPT_VERSION } from "../src/lib/ai/prompt.ts";
import {
  callGemma,
  gemmaConfig,
  type ChatMessage,
  type GemmaConfig,
} from "../src/lib/ai/gemma.ts";
import { extractWithGemma } from "../src/lib/ai/extract.ts";
import { validateExtraction } from "../src/lib/ai/validate.ts";
import { AppError } from "../src/lib/security/errors.ts";

const fixtures = new URL("../tests/fixtures/documents/", import.meta.url);
const labels = JSON.parse(
  await readFile(new URL("labels.json", fixtures), "utf8"),
);
const documents = [
  ["hosting-invoice-two-dates.txt", "text/plain"],
  ["hosting-invoice-two-dates.pdf", "application/pdf"],
  ["insurance-certificate.txt", "text/plain"],
  ["no-date-letter.txt", "text/plain"],
  ["ambiguous-date.txt", "text/plain"],
  ["malicious-prompt.txt", "text/plain"],
  ["scanned-no-text.pdf", "application/pdf"],
] as const;

const config = gemmaConfig();
// Counts every real HTTP call, including retried attempts whose answer was invalid.
let calls: { ms: number; ok: boolean }[] = [];
async function countedCall(cfg: GemmaConfig, messages: ChatMessage[]) {
  const started = performance.now();
  try {
    const result = await callGemma(cfg, messages);
    calls.push({ ms: result.elapsedMs, ok: true });
    return result;
  } catch (error) {
    calls.push({ ms: Math.round(performance.now() - started), ok: false });
    throw error;
  }
}
const results = [];
for (const [name, type] of documents) {
  const label = labels[name.replace(/\.pdf$/, ".txt")] ?? labels[name];
  const started = new Date().toISOString();
  calls = [];
  try {
    const bytes = await readFile(new URL(name, fixtures));
    const upload = validateDocument(name, type, bytes);
    const text = await extractDocumentText(upload);
    const prompt = buildExtractionPrompt(text);
    const {
      output,
      result: model,
      attempts,
      elapsedMs,
    } = await extractWithGemma(config, prompt.messages, countedCall);
    const validated = validateExtraction(output, {
      pages: prompt.analysedPages,
      paged: text.paged,
      truncated: prompt.truncated,
      today: "2026-10-14",
    });
    const date = validated.candidate.date;
    const checks: Record<string, boolean> = {
      dateStatus: date.status === label.dateStatus,
      renewalIso: date.iso === label.renewalIso,
    };
    if (label.interpretations)
      checks.interpretations =
        JSON.stringify(date.interpretations) ===
        JSON.stringify(label.interpretations);
    if (label.forbiddenIso)
      checks.forbiddenDateRejected =
        date.iso !== label.forbiddenIso &&
        !date.interpretations.includes(label.forbiddenIso);
    if (label.injectionWarning)
      checks.injectionWarning = validated.warnings.some((w) =>
        w.includes("instruction-like text"),
      );
    if (label.amountMinor !== undefined)
      checks.amountMinor =
        validated.candidate.amount.minor === label.amountMinor;
    results.push({
      document: name,
      startedAtUtc: started,
      outcome: "model_called",
      requestedModelId: config.modelId,
      providerReportedModelId: model.modelId,
      provider: model.provider,
      latencyMs: elapsedMs,
      attempts,
      httpCalls: calls,
      usage: model.usage ?? null,
      textExtractionMethod: text.method,
      pages: text.pages.length,
      promptVersion: PROMPT_VERSION,
      rawModelJson: output,
      validated: {
        dateStatus: date.status,
        raw: date.raw,
        iso: date.iso,
        modelIso: date.modelIso,
        interpretations: date.interpretations,
        type: date.type,
        evidence: date.evidence?.match ?? null,
        evidencePage: date.evidence?.page ?? null,
        otherDates: validated.candidate.otherDates.map((item) => ({
          raw: item.raw,
          iso: item.iso,
          type: item.type,
        })),
        amount: validated.candidate.amount,
        warnings: validated.warnings,
      },
      labelChecks: checks,
      matchesLabels: Object.values(checks).every(Boolean),
    });
  } catch (error) {
    const code = error instanceof AppError ? error.code : "UNEXPECTED";
    results.push({
      document: name,
      startedAtUtc: started,
      outcome: calls.length
        ? "model_called_output_rejected"
        : "rejected_before_model_call",
      errorCode: code,
      httpCalls: calls,
      expectedErrorCode: label?.errorCode ?? null,
      matchesLabels: label?.errorCode === code,
    });
  }
}
const latencies = results
  .flatMap((row) => ("latencyMs" in row ? [row.latencyMs as number] : []))
  .sort((a, b) => a - b);
const allCalls = results.flatMap(
  (row) => (row.httpCalls as { ms: number; ok: boolean }[]) ?? [],
);
const report = {
  _note:
    "Real Gemma inference over SYNTHETIC fixtures. latencyMs = measured wall-clock model time per document including any retry; httpCalls lists every real call. Sample size is tiny; this is a smoke proof, not the P7 benchmark.",
  generatedAtUtc: new Date().toISOString(),
  endpointHost: new URL(config.baseUrl).host,
  requestedModelId: config.modelId,
  documentsWithValidModelAnswer: latencies.length,
  httpModelCalls: allCalls.length,
  invalidModelAnswers: allCalls.filter((call) => !call.ok).length,
  latencyMs: {
    min: latencies[0] ?? null,
    median: latencies.length
      ? latencies.length % 2
        ? latencies[(latencies.length - 1) / 2]
        : Math.round(
            (latencies[latencies.length / 2 - 1] +
              latencies[latencies.length / 2]) /
              2,
          )
      : null,
    max: latencies.at(-1) ?? null,
  },
  documentsMatchingLabels: results.filter((row) => row.matchesLabels).length,
  documents: results.length,
  results,
};
await mkdir("docs/evidence/p3", { recursive: true });
await writeFile(
  "docs/evidence/p3/gemma-live-proof.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
for (const row of results)
  console.log(
    [
      row.document.padEnd(32),
      "validated" in row && row.validated
        ? `${row.providerReportedModelId} ${String(row.latencyMs).padStart(6)}ms x${row.attempts} ${row.validated.dateStatus.padEnd(11)} ${row.validated.iso ?? "-"}`
        : `${row.outcome}: ${row.errorCode} (${(row.httpCalls ?? []).length} model call(s))`,
      row.matchesLabels ? "MATCH" : "MISMATCH",
    ].join("  "),
  );
console.log(
  `http model calls=${report.httpModelCalls} invalid answers=${report.invalidModelAnswers} median=${report.latencyMs.median}ms min=${report.latencyMs.min}ms max=${report.latencyMs.max}ms labels matched ${report.documentsMatchingLabels}/${report.documents}`,
);
