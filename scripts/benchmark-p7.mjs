// Opt-in real network benchmark. No persistence, email or alternate model fallback.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  candidateFields,
  regexBaseline,
  score,
  summarize,
  latencySummary,
  fields,
  csvCell,
} from "./benchmark/p7-core.mjs";
const datasetPath = "tests/fixtures/benchmark/p7/dataset.json";
const bytes = await readFile(datasetPath);
const dataset = JSON.parse(bytes);
const outputArg = process.argv.indexOf("--out");
const output =
  outputArg >= 0
    ? process.argv[outputArg + 1]
    : `docs/evidence/p7/benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}`;
if (!output || !/^docs\/evidence\/p7\/[a-zA-Z0-9_-]+$/.test(output))
  throw new Error("Output must be a new docs/evidence/p7/<run> directory.");
await mkdir(output, { recursive: false });
const configured = parseEnv(await readFile(".env", "utf8"));
Object.assign(process.env, configured, { SENTRY_DSN: "", NODE_ENV: "test" });
const { gemmaConfig, callGemma } = await import("../src/lib/ai/gemma.ts");
const { extractWithGemma } = await import("../src/lib/ai/extract.ts");
const { buildExtractionPrompt, PROMPT_VERSION } = await import(
  "../src/lib/ai/prompt.ts"
);
const { validateExtraction } = await import("../src/lib/ai/validate.ts");
const { normalizeExtractedText } = await import("../src/lib/documents/text.ts");
const report = {
  version: "p7-eval-v1",
  startedAt: new Date().toISOString(),
  datasetSha256: createHash("sha256").update(bytes).digest("hex"),
  datasetPath,
  referenceProvenance: dataset.provenance,
  baseline: "first-date-first-amount-v1",
  promptVersion: PROMPT_VERSION,
  gitHead: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  workingTree: "Includes uncommitted P6/P7 changes; see sourceHashes.",
  sourceHashes: {},
  configuration: {},
  rows: [],
};
for (const path of [
  "src/lib/ai/gemma.ts",
  "src/lib/ai/extract.ts",
  "src/lib/ai/prompt.ts",
  "src/lib/ai/schema.ts",
  "src/lib/ai/validate.ts",
  "scripts/benchmark/p7-core.mjs",
])
  report.sourceHashes[path] = createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
let config;
try {
  config = gemmaConfig();
  report.configuration = {
    model: config.modelId,
    providerHost: new URL(config.baseUrl).host,
    timeoutMs: config.timeoutMs,
    maxAttempts: 2,
    temperature: 0,
    telemetryDisabledForBenchmark: true,
  };
} catch (error) {
  report.configuration = { errorCode: error?.code ?? "UNEXPECTED" };
}
async function persist() {
  report.summary = {
    gemma: summarize(report.rows, "gemma"),
    baseline: summarize(report.rows, "baseline"),
    documentLatency: latencySummary(
      report.rows
        .filter((row) => row.gemma.elapsedMs !== null)
        .map((row) => row.gemma.elapsedMs),
    ),
    wallMs: Date.now() - Date.parse(report.startedAt),
  };
  await writeFile(
    output + "/results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  const header = [
    "id",
    "method",
    "error",
    "elapsed_ms",
    "attempts",
    "strict_all",
    ...fields,
    ...fields.map((field) => "value_" + field),
  ];
  const lines = [header];
  for (const row of report.rows)
    for (const method of ["gemma", "baseline"])
      lines.push([
        row.id,
        method,
        row[method].errorCode ?? "",
        row[method].elapsedMs,
        row[method].attempts ?? "",
        Object.values(row[method].scores).every(Boolean),
        ...fields.map((field) => row[method].scores[field]),
        ...fields.map((field) =>
          JSON.stringify(row[method].actual?.[field] ?? null),
        ),
      ]);
  await writeFile(
    output + "/results.csv",
    lines.map((line) => line.map(csvCell).join(",")).join("\n") + "\n",
  );
}
for (const document of dataset.documents) {
  const text = normalizeExtractedText(document.text);
  const baselineStart = performance.now();
  const baseline = regexBaseline(text);
  const baselineMs = performance.now() - baselineStart;
  const row = {
    id: document.id,
    tags: document.tags,
    reference: document.reference,
    baseline: {
      actual: baseline,
      scores: score(document, baseline),
      elapsedMs: baselineMs,
    },
    gemma: {
      actual: null,
      scores: score(document, null),
      elapsedMs: null,
      attempts: 0,
      attemptDetails: [],
    },
  };
  const start = performance.now();
  try {
    if (!config) throw new Error("UNCONFIGURED");
    const prompt = buildExtractionPrompt({
      method: "txt_utf8",
      pages: [text],
      paged: false,
    });
    const extraction = await extractWithGemma(
      config,
      prompt.messages,
      async (...args) => {
        const attemptStart = performance.now();
        const attempt = { number: row.gemma.attemptDetails.length + 1 };
        row.gemma.attemptDetails.push(attempt);
        try {
          const result = await callGemma(...args);
          attempt.elapsedMs = Math.round(performance.now() - attemptStart);
          attempt.modelId = result.modelId;
          attempt.usage = result.usage;
          attempt.content = result.content;
          return result;
        } catch (error) {
          attempt.elapsedMs = Math.round(performance.now() - attemptStart);
          attempt.errorCode = error?.code ?? "UNEXPECTED";
          throw error;
        }
      },
    );
    const validated = validateExtraction(extraction.output, {
      pages: prompt.analysedPages,
      paged: false,
      truncated: prompt.truncated,
      today: dataset.evaluationToday,
    });
    row.gemma.rawOutput = extraction.output;
    row.gemma.actual = candidateFields(validated.candidate);
    row.gemma.warnings = validated.warnings;
    row.gemma.modelId = extraction.result.modelId;
    row.gemma.scores = score(document, row.gemma.actual);
  } catch (error) {
    row.gemma.errorCode =
      error?.code ?? (config ? "UNEXPECTED" : "AI_NOT_CONFIGURED");
  }
  row.gemma.elapsedMs = config ? Math.round(performance.now() - start) : null;
  row.gemma.attempts = row.gemma.attemptDetails.length;
  report.rows.push(row);
  await persist();
  console.log(
    JSON.stringify({
      id: row.id,
      error: row.gemma.errorCode ?? null,
      elapsedMs: row.gemma.elapsedMs,
      correctFields: Object.values(row.gemma.scores).filter(Boolean).length,
      totalFields: fields.length,
    }),
  );
}
report.finishedAt = new Date().toISOString();
report.summaryCompleted = true;
await persist();
console.log(JSON.stringify({ output, summary: report.summary }));
if (!config) process.exitCode = 2;
