// Authorized P5 HTTPS acceptance on the known live service, synthetic owner only.
// Creates a NEW isolated organization in the configured Atlas app DB; never reads
// another owner's records, sends email or changes a real customer's due date.
import { parseEnv } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const env = parseEnv(await readFile(".env", "utf8"));
const base = "https://kai247.onrender.com";
Object.assign(process.env, env, { NODE_ENV: "production" });
const { provisionOwner } = await import("../src/lib/auth/provision.ts");
const { closeDatabase } = await import("../src/lib/db/client.ts");
const email = `p5-live-${randomBytes(6).toString("hex")}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const report = {
  timestampUtc: new Date().toISOString(),
  target: base,
  dataset:
    "New isolated SYNTHETIC owner/org in configured Atlas app database; no cross-owner reads",
  checks: [],
  outcome: "running",
  realEmailSent: false,
};
let cookie = "";
let stage = "readiness";
const stamp = Date.now();
const call = async (path, method = "GET", body) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method !== "GET" ? { origin: base } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { "content-type": "application/json" }
        : {}),
    },
    ...(body === undefined
      ? {}
      : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    signal: AbortSignal.timeout(150000),
    redirect: "manual",
  });
  const data = await response.json();
  return { response, ...data };
};
await mkdir(".local", { recursive: true });
await mkdir("docs/evidence/p5", { recursive: true });
try {
  const health = await call("/api/health");
  report.healthStatus = health.response.status;
  assert.equal(health.response.status, 200);
  assert.deepEqual(health.data, { status: "ready" });
  report.checks.push(
    "Public HTTPS health returns 200 with minimal readiness and no infrastructure disclosure.",
  );
  stage = "synthetic-owner-provision";
  await provisionOwner({
    email,
    password,
    displayName: "Synthetic P5 live owner",
    organizationName: "Synthetic P5 live acceptance",
    isDemo: true,
  });
  await writeFile(
    `.local/p5-live-${stamp}.json`,
    JSON.stringify({ base, email, password }, {}, 2),
    { flag: "wx" },
  );
  stage = "login";
  const login = await call("/api/auth/login", "POST", { email, password });
  report.loginStatus = login.response.status;
  assert.equal(login.response.status, 200);
  const sealed = login.response.headers.get("set-cookie");
  assert.match(sealed, /; Secure/);
  assert.match(sealed, /HttpOnly/);
  assert.match(sealed, /SameSite=Lax/);
  cookie = sealed.split(";")[0];
  report.checks.push(
    "Real HTTPS synthetic owner login with Secure/HttpOnly/SameSite cookie; no credential or cookie value recorded.",
  );
  stage = "manual-crud";
  const input = {
    title: "SYNTHETIC P5 live domain",
    category: "digital_infrastructure",
    dueDate: "2028-06-15",
    dateType: "renewal",
    timezone: "Africa/Lagos",
  };
  const created = await call("/api/renewals", "POST", input);
  assert.equal(created.response.status, 201);
  report.manualId = created.data.id;
  assert.equal(
    (await call(`/api/renewals/${report.manualId}`)).data.renewal.dueDate,
    input.dueDate,
  );
  assert.equal(
    (
      await call(`/api/renewals/${report.manualId}`, "PATCH", {
        ...input,
        title: "SYNTHETIC P5 edited domain",
        version: 1,
      })
    ).response.status,
    200,
  );
  assert.equal(
    (
      await call(`/api/renewals/${report.manualId}/renew`, "POST", {
        version: 2,
        dueDate: "2029-06-15",
        notes: "Synthetic P5 HTTPS acceptance",
      })
    ).response.status,
    200,
  );
  const fresh = await call(`/api/renewals/${report.manualId}`);
  assert.equal(fresh.data.renewal.version, 3);
  assert.equal(fresh.data.renewal.dueDate, "2029-06-15");
  assert(fresh.data.history.some((h) => h.action === "renewed"));
  report.checks.push(
    "Deployed create/read/edit/renew/new-request read and completion history persist in the isolated owner workspace.",
  );
  stage = "real-gemma";
  const form = new FormData();
  form.append(
    "file",
    new File(
      [
        await readFile(
          "tests/fixtures/documents/hosting-invoice-two-dates.pdf",
        ),
      ],
      "hosting-invoice-two-dates.pdf",
      { type: "application/pdf" },
    ),
  );
  const upload = await call("/api/extractions", "POST", form);
  report.uploadStatus = upload.response.status;
  if (upload.response.status !== 201) {
    report.extractionErrorCode = upload.error?.code;
    throw new Error("Upload did not complete");
  }
  const x = upload.data;
  assert.equal(x.validationStatus, "pending_review");
  assert.equal(x.textExtractionMethod, "pdf_text_layer");
  assert.match(x.modelId, /^gemma-/);
  assert(x.candidateFields.date.evidence?.match);
  assert.equal((await call("/api/renewals")).data.length, 1);
  report.extraction = {
    id: x.id,
    modelId: x.modelId,
    modelMs: x.elapsedMs,
    method: x.textExtractionMethod,
    status: x.validationStatus,
  };
  stage = "approval";
  const confirm = await call(`/api/extractions/${x.id}/confirm`, "POST", {
    ...input,
    title: "SYNTHETIC P5 live approved hosting",
    dueDate: "2027-10-21",
    evidenceChecked: true,
    acknowledgeDateDiffers: true,
  });
  assert.equal(confirm.response.status, 201);
  report.documentRenewalId = confirm.data.renewal.id;
  assert.equal(
    (await call(`/api/renewals/${report.documentRenewalId}`)).data.renewal
      .dueDate,
    "2027-10-21",
  );
  report.checks.push(
    "Actual deployed PDF/Gemma pending candidate -> explicit reference-labelled synthetic owner approval -> persisted renewal; no model-direct creation.",
  );
  report.email = {
    status: "BLOCKED",
    reason:
      "This synthetic owner is .invalid/unverified and opted out. No real verified private owner/recipient was supplied; provider unconfigured locally.",
  };
  report.privateCredentialFile = `.local/p5-live-${stamp}.json`;
  report.outcome = "PASS_CORE_EMAIL_BLOCKED";
} catch {
  report.outcome = "FAIL";
  report.failedStage = stage;
  process.exitCode = 1;
} finally {
  if (cookie) {
    try {
      await call("/api/auth/logout", "POST", {});
    } catch {}
  }
  await closeDatabase();
  await writeFile(
    `docs/evidence/p5/live-smoke-${stamp}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
