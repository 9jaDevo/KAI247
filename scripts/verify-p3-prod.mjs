// Production-bundle smoke test (`next start`) for the P3 path with REAL Gemma.
// Uploads the SYNTHETIC PDF invoice, checks the pending candidate, then declines it.
// Credentials come from the ignored synthetic .env.local and are never printed.
// Usage: KAI247_PROD_URL=http://127.0.0.1:3100 node --env-file=.env.local scripts/verify-p3-prod.mjs
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

if (process.env.SEED_OWNER_MODE !== "synthetic")
  throw new Error("Requires the synthetic local sandbox configuration.");
const target = process.env.KAI247_PROD_URL || "http://127.0.0.1:3100";
// Mutations must carry the configured APP_URL origin, as a browser on that origin would.
const origin = new URL(process.env.APP_URL || "http://127.0.0.1:3000").origin;
const report = { timestampUtc: new Date().toISOString(), target, checks: [] };
try {
  const login = await fetch(`${target}/api/auth/login`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({
      email: process.env.SEED_OWNER_EMAIL,
      password: process.env.SEED_OWNER_PASSWORD,
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const form = new FormData();
  const pdf = await readFile(
    "tests/fixtures/documents/hosting-invoice-two-dates.pdf",
  );
  form.append(
    "file",
    new File([pdf], "hosting-invoice-two-dates.pdf", {
      type: "application/pdf",
    }),
  );
  const started = Date.now();
  const upload = await fetch(`${target}/api/extractions`, {
    method: "POST",
    headers: { origin, cookie },
    body: form,
  });
  const body = await upload.json();
  report.uploadStatus = upload.status;
  report.httpSeconds = Math.round((Date.now() - started) / 100) / 10;
  if (upload.status !== 201) {
    report.error = body.error;
    throw new Error(`Upload returned ${upload.status} ${body.error?.code}`);
  }
  const data = body.data;
  report.extraction = {
    id: data.id,
    modelId: data.modelId,
    provider: data.provider,
    modelMs: data.elapsedMs,
    modelAttempts: data.modelAttempts,
    textExtractionMethod: data.textExtractionMethod,
    pageCount: data.pageCount,
    validationStatus: data.validationStatus,
    dateStatus: data.candidateFields.date.status,
    iso: data.candidateFields.date.iso,
    evidence: data.candidateFields.date.evidence?.match ?? null,
    evidencePage: data.candidateFields.date.evidence?.page ?? null,
  };
  assert.equal(data.validationStatus, "pending_review");
  assert.equal(data.textExtractionMethod, "pdf_text_layer");
  assert.match(data.modelId, /^gemma-/);
  report.checks.push(
    "Production bundle parsed the PDF text layer (unpdf) and returned a real Gemma pending_review candidate.",
  );
  const reject = await fetch(`${target}/api/extractions/${data.id}/reject`, {
    method: "POST",
    headers: { origin, cookie, "content-type": "application/json" },
    body: JSON.stringify({ reason: "Production smoke test cleanup" }),
  });
  assert.equal(reject.status, 200);
  report.checks.push("Smoke candidate declined; no renewal created.");
  await fetch(`${target}/api/auth/logout`, {
    method: "POST",
    headers: { origin, cookie },
  });
  report.outcome = "pass";
} catch (error) {
  report.outcome = "fail";
  report.failure = error instanceof Error ? error.message : String(error);
}
await writeFile(
  "docs/evidence/p3/prod-bundle-smoke.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.outcome === "pass" ? 0 : 1;
