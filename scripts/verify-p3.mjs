// P3 browser acceptance run against the local dev app with REAL Gemma (no mocks).
// Uploads only SYNTHETIC fixtures. Credentials come from the ignored synthetic
// .env.local and are never printed or written to the report.
// Usage: KAI247_PLAYWRIGHT_MODULE=<dir> [KAI247_BROWSER_CHANNEL=chrome] \
//   node --env-file=.env.local scripts/verify-p3.mjs
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.KAI247_PLAYWRIGHT_MODULE || "playwright",
);
if (
  process.env.SEED_OWNER_MODE !== "synthetic" ||
  !process.env.SEED_OWNER_PASSWORD
)
  throw new Error(
    "Browser QA requires the explicitly synthetic local sandbox configuration.",
  );
const base = process.env.APP_URL || "http://127.0.0.1:3000";
const output = "docs/evidence/p3";
const fixture = (name) =>
  fileURLToPath(
    new URL(`../tests/fixtures/documents/${name}`, import.meta.url),
  );
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.KAI247_BROWSER_CHANNEL
    ? { channel: process.env.KAI247_BROWSER_CHANNEL }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
});
const page = await context.newPage();
const report = {
  timestampUtc: new Date().toISOString(),
  outcome: "running",
  model: "Real Gemma through the app's own adapter; no mock in this run",
  database: "Local MongoDB 8.2.6 replica set; Atlas not verified",
  checks: [],
  extractions: [],
  screenshots: [],
  errors: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
const stamp = Date.now();
const editedTitle = `Website hosting — synthetic P3 demo ${stamp}`;

async function capture(name, fullPage = true) {
  const path = `${output}/${name}.png`;
  await page.screenshot({ path, fullPage, animations: "disabled" });
  report.screenshots.push(path);
}
const api = async (path) => (await page.request.get(`${base}${path}`)).json();
const renewalCount = async () =>
  (await api("/api/renewals?status=all")).data.length;
const extractionCount = async () => (await api("/api/extractions")).data.length;
async function upload(name) {
  await page.goto(`${base}/app/import`, { waitUntil: "networkidle" });
  await page
    .getByLabel("Choose a document", { exact: true })
    .setInputFiles(fixture(name));
  const started = Date.now();
  await page
    .getByRole("button", { name: "Extract with Gemma", exact: true })
    .click();
  return started;
}
async function extractToReview(name) {
  const started = await upload(name);
  await page.waitForURL(/\/app\/import\/[a-f0-9]{24}$/, { timeout: 150_000 });
  await page
    .getByRole("heading", { name: "You have the final say." })
    .waitFor();
  const id = new URL(page.url()).pathname.split("/").at(-1);
  const extraction = (await api(`/api/extractions/${id}`)).data;
  report.extractions.push({
    fixture: name,
    id,
    uiSecondsUploadToReview: Math.round((Date.now() - started) / 100) / 10,
    modelId: extraction.modelId,
    provider: extraction.provider,
    modelMs: extraction.elapsedMs,
    modelAttempts: extraction.modelAttempts,
    usage: extraction.usage ?? null,
    validationStatus: extraction.validationStatus,
    dateStatus: extraction.candidateFields.date.status,
    raw: extraction.candidateFields.date.raw,
    iso: extraction.candidateFields.date.iso,
    interpretations: extraction.candidateFields.date.interpretations,
    evidence: extraction.candidateFields.date.evidence?.match ?? null,
    otherDates: extraction.candidateFields.otherDates.map((item) => ({
      raw: item.raw,
      type: item.type,
      iso: item.iso,
    })),
    warnings: extraction.warnings,
  });
  assert.equal(extraction.validationStatus, "pending_review");
  assert.match(extraction.modelId, /^gemma-/);
  return { id, extraction };
}
async function decline(reason) {
  await page
    .getByRole("button", { name: "Decline candidate", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason (optional)").fill(reason);
  await dialog
    .getByRole("button", { name: "Decline candidate", exact: true })
    .click();
  await page.getByText("Declined — no renewal was created").waitFor();
}

try {
  const anonymous = await page.request.post(`${base}/api/extractions`, {
    headers: { origin: base },
    multipart: {
      file: {
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Renews 1 May 2027"),
      },
    },
  });
  assert.equal(anonymous.status(), 401);
  await page.goto(`${base}/app/import`, { waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/login");
  report.checks.push(
    "Unauthenticated upload API returns 401 and /app/import redirects to sign-in.",
  );

  await page
    .getByLabel("Email address", { exact: true })
    .fill(process.env.SEED_OWNER_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${base}/app`);
  const crossOrigin = await page.request.post(`${base}/api/extractions`, {
    headers: { origin: "https://evil.invalid" },
    multipart: {
      file: {
        name: "a.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Renews 1 May 2027"),
      },
    },
  });
  assert.equal(crossOrigin.status(), 403);
  report.checks.push(
    "Owner signed in; a cross-origin authenticated upload is rejected with 403.",
  );

  await page.goto(`${base}/app/import`, { waitUntil: "networkidle" });
  await page.getByText(/Live extraction with gemma-/).waitFor();
  await capture("import-1280");
  const renewalsBefore = await renewalCount();
  const extractionsBefore = await extractionCount();

  await upload("scanned-no-text.pdf");
  await page
    .getByText(/no extractable text layer/i)
    .waitFor({ timeout: 30_000 });
  assert.equal(await extractionCount(), extractionsBefore);
  await capture("scanned-pdf-rejected-1280", false);
  report.checks.push(
    "Scanned image-only PDF rejected with NO_TEXT_LAYER message before any model call; nothing persisted. OCR not claimed.",
  );

  const invoice = await extractToReview("hosting-invoice-two-dates.pdf");
  await page
    .locator("mark", { hasText: "renews on 21 October 2027" })
    .first()
    .waitFor();
  await page
    .getByText(invoice.extraction.modelId, { exact: false })
    .first()
    .waitFor();
  assert.equal(await renewalCount(), renewalsBefore);
  assert.equal(
    await page.getByLabel("Due date", { exact: true }).inputValue(),
    "2027-10-21",
  );
  await capture("review-invoice-1280");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  assert(overflow <= 0, `review page overflows at 360px by ${overflow}px`);
  await capture("review-invoice-360");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  report.checks.push(
    `Real Gemma candidate for the PDF invoice is pending_review with highlighted verbatim evidence (page ${invoice.extraction.candidateFields.date.evidence?.page}); renewal count unchanged before approval; review page has no horizontal overflow at 360px.`,
  );

  await page.getByLabel(/^Renewal title \*/).fill(editedTitle);
  await page
    .getByLabel("Responsible person", { exact: true })
    .fill("Synthetic owner");
  const approve = page.getByRole("button", {
    name: "Approve & save",
    exact: true,
  });
  assert.equal(await approve.isDisabled(), true);
  await page
    .getByLabel(
      "I checked the highlighted source evidence and confirm these details.",
    )
    .check();
  await approve.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm and save", exact: true })
    .click();
  await page.waitForURL(/\/app\/renewals\/[a-f0-9]{24}$/, { timeout: 30_000 });
  const renewalId = new URL(page.url()).pathname.split("/").at(-1);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: editedTitle, exact: true }).waitFor();
  await page
    .locator("mark", { hasText: "renews on 21 October 2027" })
    .waitFor();
  const stored = (await api(`/api/renewals/${renewalId}`)).data;
  assert.equal(stored.renewal.dueDate, "2027-10-21");
  assert.equal(stored.renewal.dateSource, "document_confirmed");
  assert.equal(stored.renewal.responsibleLabel, "Synthetic owner");
  assert.equal(stored.history[0].action, "created_from_document");
  assert.match(stored.history[0].changesSummary, /title/);
  assert.equal(await renewalCount(), renewalsBefore + 1);
  const after = (await api(`/api/extractions/${invoice.id}`)).data;
  assert.equal(after.validationStatus, "confirmed");
  assert.equal(after.renewalId, renewalId);
  assert.equal((await api("/api/activity")).data.length, 0);
  await capture("renewal-from-document-1280");
  report.renewal = {
    id: renewalId,
    title: stored.renewal.title,
    dueDate: stored.renewal.dueDate,
    dateSource: stored.renewal.dateSource,
    sourceExcerpt: stored.renewal.sourceExcerpt,
    sourceFilename: stored.renewal.sourceFilename,
    historyActions: stored.history.map((event) => event.action),
    auditSummary: stored.history[0].changesSummary,
  };
  report.checks.push(
    "Owner edited title and responsible person, ticked the evidence confirmation and approved; reload shows the persisted renewal (2027-10-21, document_confirmed, exact source excerpt, created_from_document audit). Extraction is now confirmed; zero reminder jobs exist (P4).",
  );

  const ambiguous = await extractToReview("ambiguous-date.txt");
  assert.equal(ambiguous.extraction.candidateFields.date.status, "ambiguous");
  assert.equal(ambiguous.extraction.candidateFields.date.iso, null);
  await page.getByLabel("3 Apr 2027 (read as DD/MM)").waitFor();
  await page.getByLabel("4 Mar 2027 (read as MM/DD)").waitFor();
  assert.equal(
    await page.getByLabel("Due date", { exact: true }).inputValue(),
    "",
  );
  await capture("review-ambiguous-1280");
  await decline("Synthetic QA: ambiguous fixture declined");
  report.checks.push(
    "Ambiguous 03/04/2027: no date preselected, both DD/MM and MM/DD readings offered; declined with reason; no renewal created.",
  );

  const malicious = await extractToReview("malicious-prompt.txt");
  const maliciousDate = malicious.extraction.candidateFields.date;
  assert.notEqual(maliciousDate.iso, "2030-01-01");
  assert(!maliciousDate.interpretations.includes("2030-01-01"));
  await page.getByText(/instruction-like text aimed at AI systems/).waitFor();
  await capture("review-malicious-1280");
  await decline("Synthetic QA: injection fixture declined");
  report.checks.push(
    `Prompt-injection fixture: injected 2030-01-01 not accepted (candidate ${maliciousDate.iso ?? "none"}, status ${maliciousDate.status}); injection warning displayed; declined.`,
  );

  const letter = await extractToReview("no-date-letter.txt");
  assert.equal(letter.extraction.candidateFields.date.status, "missing");
  await page
    .getByRole("heading", { name: "No dependable date to confirm" })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Approve & save" }).count(),
    0,
  );
  await capture("review-no-date-1280");
  await decline("Synthetic QA: no-date fixture declined");
  report.checks.push(
    "No-date letter: missing status, no approve control, manual-entry link offered; declined; relative '30 days' deadline not converted to a date.",
  );

  assert.equal(await renewalCount(), renewalsBefore + 1);
  await page.goto(`${base}/app/import`, { waitUntil: "networkidle" });
  await capture("import-recent-1280");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  await capture("import-recent-360");
  report.checks.push(
    "Across all runs only the explicitly approved candidate created a renewal (exactly +1).",
  );
  report.outcome = report.errors.length ? "fail" : "pass";
} catch (error) {
  report.outcome = "fail";
  report.failure = error instanceof Error ? error.message : String(error);
  await capture("failure").catch(() => undefined);
} finally {
  await page.request
    .post(`${base}/api/auth/logout`, { headers: { origin: base } })
    .catch(() => undefined);
  await browser.close();
  await writeFile(
    `${output}/browser-report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(`P3 browser verification: ${report.outcome}`);
  for (const check of report.checks) console.log(`- ${check}`);
  for (const item of report.extractions)
    console.log(
      `  ${item.fixture}: ${item.modelId} model ${item.modelMs}ms x${item.modelAttempts}, UI ${item.uiSecondsUploadToReview}s, date ${item.dateStatus} ${item.iso ?? "-"}`,
    );
  if (report.failure) console.log(`FAILURE: ${report.failure}`);
  if (report.errors.length)
    console.log(`Page errors: ${report.errors.join(" | ")}`);
  process.exitCode = report.outcome === "pass" ? 0 : 1;
}
