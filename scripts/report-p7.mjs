import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  score,
  summarize,
  latencySummary,
  fields,
} from "./benchmark/p7-core.mjs";
const run = process.argv[2] ?? "docs/evidence/p7/run-01";
if (!/^docs\/evidence\/p7\/[a-zA-Z0-9_-]+$/.test(run))
  throw new Error("Choose a P7 run directory.");
const report = JSON.parse(await readFile(run + "/results.json", "utf8"));
const bytes = await readFile(report.datasetPath);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  report.datasetSha256,
  "Dataset changed since measured run",
);
const dataset = JSON.parse(bytes);
assert.deepEqual(
  report.rows.map((row) => row.id),
  dataset.documents.map((doc) => doc.id),
  "Missing/reordered benchmark cases",
);
for (const [i, row] of report.rows.entries())
  for (const method of ["gemma", "baseline"])
    assert.deepEqual(
      row[method].scores,
      score(dataset.documents[i], row[method].actual),
      "Scores do not reproduce",
    );
const summary = {
  gemma: summarize(report.rows, "gemma"),
  baseline: summarize(report.rows, "baseline"),
};
const errors = {};
const usage = {
  promptTokens: 0,
  completionTokens: 0,
  responsesWithUsage: 0,
  missingUsageAttempts: 0,
};
for (const row of report.rows) {
  if (row.gemma.errorCode)
    errors[row.gemma.errorCode] = (errors[row.gemma.errorCode] ?? 0) + 1;
  for (const attempt of row.gemma.attemptDetails) {
    if (attempt.usage) {
      usage.promptTokens += attempt.usage.promptTokens ?? 0;
      usage.completionTokens += attempt.usage.completionTokens ?? 0;
      usage.responsesWithUsage++;
    } else usage.missingUsageAttempts++;
  }
}
const analysis = {
  utc: new Date().toISOString(),
  scoresReproduced: true,
  ...summary,
  errors,
  usage,
  allAttemptedDocumentLatency: latencySummary(
    report.rows
      .map((row) => row.gemma.elapsedMs)
      .filter((value) => value !== null),
  ),
  successfulDocumentLatency: latencySummary(
    report.rows
      .filter((row) => row.gemma.actual)
      .map((row) => row.gemma.elapsedMs),
  ),
  wallMs: report.summary.wallMs,
  attemptedDocumentsPerMinute:
    report.rows.length / (report.summary.wallMs / 60000),
};
await writeFile(
  run + "/analysis.json",
  JSON.stringify(analysis, null, 2) + "\n",
);
const lines = [
  "# P7 measured results",
  "",
  `Run: ${report.startedAt} to ${report.finishedAt}. Dataset SHA256: ${report.datasetSha256}.`,
  `All ${report.rows.length} documents were attempted through the real adapter. This run is not a deployment or independent human evaluation.`,
  "",
  "| Field | Gemma pipeline correct / attempted | Simple regex correct / attempted |",
  "| --- | --- | --- |",
  ...fields.map(
    (field) =>
      `| ${field} | ${summary.gemma.perField[field].correct}/${report.rows.length} | ${summary.baseline.perField[field].correct}/${report.rows.length} |`,
  ),
  "",
  `Strict all-ten-fields: Gemma ${summary.gemma.strictAllFields}/${report.rows.length}; baseline ${summary.baseline.strictAllFields}/${report.rows.length}.`,
  `Completed Gemma outputs: ${summary.gemma.completed}/${report.rows.length}. Errors: ${JSON.stringify(errors)}.`,
  `All-attempt median: ${analysis.allAttemptedDocumentLatency.medianMs}ms; successful-output median: ${analysis.successfulDocumentLatency.medianMs}ms (n=${analysis.successfulDocumentLatency.n}). P95 withheld (n<20).`,
  `Serial wall time: ${analysis.wallMs}ms; throughput: ${analysis.attemptedDocumentsPerMinute.toFixed(3)} attempted documents/minute. Fast failures are not fast successful inference.`,
  `Reported usage only: ${usage.promptTokens} input / ${usage.completionTokens} output tokens, ${usage.responsesWithUsage} responses; ${usage.missingUsageAttempts} attempts lack usage. This is not a bill.`,
  "",
  "| Case | Gemma fields / 10 | Error | Milliseconds | Baseline fields / 10 |",
  "| --- | --- | --- | --- | --- |",
  ...report.rows.map(
    (row) =>
      `| ${row.id} | ${Object.values(row.gemma.scores).filter(Boolean).length} | ${row.gemma.errorCode ?? "none"} | ${row.gemma.elapsedMs} | ${Object.values(row.baseline.scores).filter(Boolean).length} |`,
  ),
  "",
  "Scores recomputed against frozen labels by `node scripts/report-p7.mjs " +
    run +
    "`. See results.json/CSV for every value, synthetic response and attempt.",
];
await writeFile(run + "/REPORT.md", lines.join("\n") + "\n");
console.log(JSON.stringify(analysis));
